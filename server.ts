import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getProvider } from './src/providers/registry';
import { estimateCost } from './src/runs/cost';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Translate Scene Idea into Godot Architecture + GitHub Tasks
  app.post('/api/translate-scene', async (req, res) => {
    try {
      const { prompt, genre, cameraMode, godotVersion } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'A scene description prompt is required.' });
        return;
      }

      const provider = getProvider('gemini');
      if (!provider) {
        throw new Error('Gemini provider is not registered.');
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not configured.');
      }

      const brief = { prompt, genre, cameraMode, godotVersion };
      const result = await provider.generateScenePlan(brief, { apiKey });

      if (!result.data) {
        res.status(422).json({
          error: 'The model returned an invalid scene plan.',
          details: result.issues?.join(' ') || 'The response could not be validated.',
          rawOutput: result.raw,
        });
        return;
      }
      res.json({
        plan: result.data,
        provider: provider.id,
        model: provider.defaultModel,
        usage: result.usage,
        costEstimateUSD: estimateCost(result.usage, provider.capabilities.costTable?.[provider.defaultModel]),
        timings: result.timings,
      });
    } catch (err: any) {
      console.error('Error generating Godot scene plan:', err);
      const status = err?.message?.includes('GEMINI_API_KEY') ? 503 : 500;
      res.status(status).json({
        error: 'Failed to generate scene plan.',
        details: status === 503
          ? 'AI generation is not configured. Add GEMINI_API_KEY to .env.local, or use a preset blueprint.'
          : err?.message || String(err),
      });
    }
  });

  // Refine or expand a specific node or feature
  app.post('/api/refine-node', async (req, res) => {
    try {
      const { nodeName, currentScript, userInstructions, sceneContext } = req.body;

      if (!nodeName || !userInstructions) {
        res.status(400).json({ error: 'Node name and instructions are required.' });
        return;
      }

      const provider = getProvider('gemini');
      if (!provider) {
        throw new Error('Gemini provider is not registered.');
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not configured.');
      }

      const reqObj = { nodeName, currentScript, userInstructions, sceneContext };
      const result = await provider.refineNode(reqObj, { apiKey });

      if (!result.data) {
        res.status(422).json({
          error: 'The model returned an invalid refinement.',
          details: result.issues?.join(' ') || 'The response could not be validated.',
          rawOutput: result.raw,
        });
        return;
      }
      res.json(result.data);
    } catch (err: any) {
      console.error('Error refining Godot node:', err);
      const status = err?.message?.includes('GEMINI_API_KEY') ? 503 : 500;
      res.status(status).json({
        error: 'Failed to refine node.',
        details: status === 503
          ? 'AI refinement is not configured. Add GEMINI_API_KEY to .env.local, or edit the exported script directly.'
          : err?.message || String(err),
      });
    }
  });

  // GitHub REST API Integration Proxy for automated issue/milestone creation
  app.post('/api/github/sync', async (req, res) => {
    try {
      const { owner, repo, token, milestones, issues } = req.body;

      if (!owner || !repo || !token) {
        res.status(400).json({ error: 'GitHub Owner, Repo, and Personal Access Token (PAT) are required.' });
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Godot-Scene-Architect-App',
        'X-GitHub-Api-Version': '2022-11-28',
      };

      const createdMilestonesMap = new Map<string, number>(); // title -> milestone_number
      const createdMilestonesList = [];
      const createdIssuesList = [];
      const errors = [];

      // GitHub rejects issue labels that do not exist yet. Create the small set
      // of labels used by the generated plan before posting issues.
      const requestedLabels = Array.from(new Set(
        (Array.isArray(issues) ? issues : [])
          .flatMap((issue: any) => Array.isArray(issue.labels) ? issue.labels : [])
          .filter((label: any): label is string => typeof label === 'string' && label.trim().length > 0)
          .map((label: string) => label.trim()),
      ));

      for (const label of requestedLabels) {
        try {
          const labelRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/labels/${encodeURIComponent(label)}`, {
            headers,
          });
          if (labelRes.status === 404) {
            const createLabelRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/labels`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ name: label, color: '38BDF8', description: 'Generated by Godot Scene Architect' }),
            });
            if (!createLabelRes.ok && createLabelRes.status !== 422) {
              const labelError: any = await createLabelRes.json().catch(() => ({}));
              errors.push(`Label "${label}": ${labelError.message || createLabelRes.statusText}`);
            }
          } else if (!labelRes.ok) {
            const labelError: any = await labelRes.json().catch(() => ({}));
            errors.push(`Label "${label}": ${labelError.message || labelRes.statusText}`);
          }
        } catch (e: any) {
          errors.push(`Label "${label}": ${e.message}`);
        }
      }

      // 1. Create Milestones
      if (Array.isArray(milestones)) {
        for (const ms of milestones) {
          try {
            const msRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/milestones`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                title: ms.title,
                description: ms.description || '',
                state: 'open',
              }),
            });

            if (msRes.ok) {
              const msData: any = await msRes.json();
              createdMilestonesMap.set(ms.title, msData.number);
              createdMilestonesList.push({
                title: msData.title,
                number: msData.number,
                url: msData.html_url,
              });
            } else {
              const errBody: any = await msRes.json();
              errors.push(`Milestone "${ms.title}": ${errBody.message || msRes.statusText}`);
            }
          } catch (e: any) {
            errors.push(`Milestone "${ms.title}": ${e.message}`);
          }
        }
      }

      // 2. Create Issues
      if (Array.isArray(issues)) {
        for (const iss of issues) {
          try {
            const milestoneNumber = createdMilestonesMap.get(iss.milestoneTitle);

            const payload: any = {
              title: iss.title,
              body: iss.bodyMarkdown || `## ${iss.title}\n\n${iss.moduleTitle}`,
              labels: Array.isArray(iss.labels) ? iss.labels : ['godot-engine'],
            };

            if (milestoneNumber) {
              payload.milestone = milestoneNumber;
            }

            const issRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
            });

            if (issRes.ok) {
              const issData: any = await issRes.json();
              createdIssuesList.push({
                title: issData.title,
                number: issData.number,
                url: issData.html_url,
              });
            } else {
              const errBody: any = await issRes.json();
              errors.push(`Issue "${iss.title}": ${errBody.message || issRes.statusText}`);
            }
          } catch (e: any) {
            errors.push(`Issue "${iss.title}": ${e.message}`);
          }
        }
      }

      res.json({
        success: createdIssuesList.length > 0 || createdMilestonesList.length > 0,
        message: `Successfully created ${createdMilestonesList.length} milestones and ${createdIssuesList.length} issues in ${owner}/${repo}.`,
        createdMilestones: createdMilestonesList,
        createdIssues: createdIssuesList,
        errors,
      });
    } catch (err: any) {
      console.error('Error syncing to GitHub:', err);
      res.status(500).json({
        error: 'Failed to sync with GitHub API.',
        details: err?.message || String(err),
      });
    }
  });

  // Vite Middleware integration for dev / static server in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Godot Scene Architect server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
