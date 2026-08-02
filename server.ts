import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI Client
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

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

      const ai = getAiClient();

      const systemInstruction = `You are a Principal Godot Engine Game Architect and Technical Project Lead.
Your goal is to translate game scene ideas into complete, production-ready Godot Engine instructions, modular node hierarchies, full GDScript code files, a valid Godot .tscn file, and structured GitHub issues and milestones for automated project management.

Rules:
1. Target Godot Version: ${godotVersion || 'Godot 4.3'}. Use strict Godot 4 syntax (e.g. @export, CharacterBody3D, move_and_slide(), TileMapLayer, GPUParticles3D).
2. Node Hierarchy: Create a realistic, logically nested Godot Node tree (Node3D/Node2D root, physics bodies, collision shapes, lighting, environment, camera, particles, sound, state machines).
3. GDScript Files: Provide complete, functional GDScript code for key nodes (player controllers, boss state machines, interaction areas, camera scripts) with signals, @export variables, and proper physics methods.
4. TSCN Content: Generate valid text-based Godot .tscn scene file contents.
5. GitHub Automated Tasks: Create 3-5 structured GitHub Milestones and 4-8 detailed GitHub Issues. Each issue MUST include acceptance criteria, Godot Editor manual setup instructions, labels (e.g., ["godot-4", "gdscript", "physics"]), and markdown description formatted for GitHub project boards.
6. Output MUST be valid JSON conforming strictly to the requested structure. Do not surround with markdown codeblocks if responseMimeType is application/json.`;

      const promptMessage = `Game Scene Concept: "${prompt}"
Genre: ${genre || 'Action / Adventure'}
Camera Mode: ${cameraMode || '3D'}
Godot Version: ${godotVersion || 'Godot 4.3'}

Generate the complete Godot Scene Architecture & GitHub Automated Project Plan.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptMessage,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sceneTitle: { type: Type.STRING },
              description: { type: Type.STRING },
              genre: { type: Type.STRING },
              godotVersion: { type: Type.STRING },
              cameraMode: { type: Type.STRING },
              nodeHierarchy: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    iconCategory: { type: Type.STRING },
                    description: { type: Type.STRING },
                    scriptName: { type: Type.STRING },
                    properties: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          type: { type: Type.STRING },
                          value: { type: Type.STRING },
                          description: { type: Type.STRING },
                        },
                        required: ['name', 'type', 'value'],
                      },
                    },
                    children: {
                      type: Type.ARRAY,
                      items: { type: Type.OBJECT }, // nested node items
                    },
                  },
                  required: ['id', 'name', 'type', 'iconCategory', 'description', 'properties'],
                },
              },
              modules: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    stageNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    estimatedHours: { type: Type.NUMBER },
                    editorSteps: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    godotNodesInvolved: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['id', 'stageNumber', 'title', 'description', 'editorSteps', 'godotNodesInvolved'],
                },
              },
              gdscripts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    filename: { type: Type.STRING },
                    nodeTarget: { type: Type.STRING },
                    description: { type: Type.STRING },
                    code: { type: Type.STRING },
                  },
                  required: ['filename', 'nodeTarget', 'description', 'code'],
                },
              },
              tscnContent: { type: Type.STRING },
              projectGodotContent: { type: Type.STRING },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    dueDateWeeks: { type: Type.NUMBER },
                    state: { type: Type.STRING },
                  },
                  required: ['id', 'title', 'description', 'dueDateWeeks'],
                },
              },
              issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    moduleTitle: { type: Type.STRING },
                    milestoneTitle: { type: Type.STRING },
                    type: { type: Type.STRING },
                    status: { type: Type.STRING },
                    labels: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    assigneeRole: { type: Type.STRING },
                    acceptanceCriteria: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    editorInstructions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    bodyMarkdown: { type: Type.STRING },
                    relatedScript: { type: Type.STRING },
                  },
                  required: ['id', 'title', 'moduleTitle', 'milestoneTitle', 'type', 'labels', 'acceptanceCriteria', 'bodyMarkdown'],
                },
              },
            },
            required: ['sceneTitle', 'description', 'nodeHierarchy', 'modules', 'gdscripts', 'tscnContent', 'milestones', 'issues'],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      res.json(parsedData);
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

      const ai = getAiClient();

      const promptMessage = `Scene Context: ${sceneContext || 'Godot Scene'}
Node Name: ${nodeName}
Existing Script (if any):
\`\`\`gdscript
${currentScript || '# No script currently'}
\`\`\`

User Refinement Request: "${userInstructions}"

Generate an updated or expanded GDScript code block along with step-by-step Godot editor configuration instructions and an updated GitHub issue body.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptMessage,
        config: {
          systemInstruction: 'You are a Godot GDScript expert. Return valid JSON containing updated GDScript code, editor instructions, and explanation.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              updatedScript: { type: Type.STRING },
              explanation: { type: Type.STRING },
              editorInstructions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              newGitHubIssue: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                  bodyMarkdown: { type: Type.STRING },
                },
              },
            },
            required: ['updatedScript', 'explanation', 'editorInstructions'],
          },
        },
      });

      const responseText = response.text || '{}';
      res.json(JSON.parse(responseText));
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
