import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { Provider, ProviderResult, SceneBrief, RefineRequest, RefineResult } from './types';
import { TranslatedScenePlan } from '../types';
import { translatedScenePlanSchema, boundedNodeItemSchema } from '../schema/scenePlan';
import { parseScenePlan } from '../schema/scenePlan';
import { PipelineParseResult, resolvePlan } from './pipeline';

/**
 * Converts a Zod schema into Google GenAI's schema representation.
 * (Gemini's Type.* format is not JSON Schema, so this converter is tailored for it)
 */
export function zodToGeminiSchema(schema: z.ZodTypeAny, fieldName?: string): any {
  let curr: any = schema;
  let isOptional = false;

  // Unwrap modifiers
  while (curr) {
    const cName = curr?.constructor?.name;
    if (cName === 'ZodPreprocess' || cName === 'ZodEffects') {
      curr = curr._def.schema;
    } else if (cName === 'ZodTransform') {
      curr = curr._def.schema;
    } else if (cName === 'ZodDefault') {
      curr = curr._def.innerType;
    } else if (cName === 'ZodOptional' || cName === 'ZodNullable') {
      isOptional = true;
      curr = curr._def.innerType;
    } else if (cName === 'ZodLazy') {
      curr = curr._def.getter();
    } else {
      break;
    }
  }

  const constructorName = curr?.constructor?.name;

  if (constructorName === 'ZodObject') {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    const shape = curr.shape;
    for (const key of Object.keys(shape)) {
      const fieldSchema = shape[key];
      properties[key] = zodToGeminiSchema(fieldSchema, key);

      // Determine if the field is required
      let isFieldOptional = false;
      let fc = fieldSchema;
      while (fc) {
        const fcName = fc?.constructor?.name;
        if (fcName === 'ZodOptional' || fcName === 'ZodNullable') {
          isFieldOptional = true;
          break;
        }
        if (fc._def.innerType) {
          fc = fc._def.innerType;
        } else if (fcName === 'ZodPreprocess' || fcName === 'ZodEffects') {
          fc = fc._def.schema;
        } else if (fcName === 'ZodTransform') {
          fc = fc._def.schema;
        } else {
          break;
        }
      }

      if (!isFieldOptional) {
        required.push(key);
      }
    }
    const result: any = { type: Type.OBJECT, properties };
    if (required.length > 0) {
      result.required = required;
    }
    return result;
  }

  if (constructorName === 'ZodArray') {
    const elementSchema = curr.element || curr._def.element || curr._def.type;
    return {
      type: Type.ARRAY,
      items: zodToGeminiSchema(elementSchema),
    };
  }

  if (constructorName === 'ZodString') {
    return { type: Type.STRING };
  }

  if (constructorName === 'ZodNumber') {
    // If it's a specific integer field, map to INTEGER, else NUMBER
    const isInt =
      curr._def.checks?.some((c: any) => c.isInt || c.format === 'safeint' || c.kind === 'int') ||
      fieldName === 'stageNumber' ||
      fieldName === 'dueDateWeeks' ||
      fieldName === 'githubIssueNumber';
    return { type: isInt ? Type.INTEGER : Type.NUMBER };
  }

  if (constructorName === 'ZodBoolean') {
    return { type: Type.BOOLEAN };
  }

  if (constructorName === 'ZodEnum' || constructorName === 'ZodNativeEnum') {
    return { type: Type.STRING };
  }

  return { type: Type.STRING };
}

// Zod Schema for refinement responses to build refineNode responseSchema dynamically
const refineResultSchema = z.object({
  updatedScript: z.string().default(''),
  explanation: z.string().default(''),
  editorInstructions: z.array(z.string()).default([]),
  newGitHubIssue: z
    .object({
      title: z.string().default(''),
      labels: z.array(z.string()).default([]),
      bodyMarkdown: z.string().default(''),
    })
    .optional(),
});

function parseRefineResult(input: unknown): PipelineParseResult<RefineResult> {
  const result = refineResultSchema.safeParse(input);
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, issues: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) };
}

function parseTranslatedScenePlan(input: unknown): PipelineParseResult<TranslatedScenePlan> {
  const result = parseScenePlan(input);
  if ('issues' in result) return { ok: false, issues: result.issues };
  return { ok: true, data: result.plan };
}

/**
 * GeminiProvider is the concrete implementation of the Provider interface for Google's Gemini models.
 */
export class GeminiProvider implements Provider {
  readonly id = 'gemini';
  readonly label = 'Google Gemini';
  readonly defaultModel = 'gemini-3.6-flash';

  readonly capabilities = {
    structuredOutput: 'native-schema' as const,
    reportsTokens: true,
    browserCallable: true,
    requiresBridge: false,
    costTable: {
      'gemini-3.6-flash': {
        inputUsdPerMTok: 0.075,
        outputUsdPerMTok: 0.30,
        asOf: '2026-08-02',
      },
    },
  };

  async listModels(auth: { apiKey?: string; baseUrl?: string }): Promise<string[]> {
    const apiKey = auth.apiKey;
    if (!apiKey) {
      throw new Error('API key is required to list Gemini models.');
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.list();
    const modelsList = response.page || [];
    return modelsList
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name || m.id || '');
  }

  async generateScenePlan(
    brief: SceneBrief,
    opts: { apiKey?: string; baseUrl?: string; model?: string },
    signal?: AbortSignal
  ): Promise<ProviderResult<TranslatedScenePlan>> {
    const apiKey = opts.apiKey;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = opts.model || this.defaultModel;

    const systemInstruction = `You are a Principal Godot Engine Game Architect and Technical Project Lead.
Your goal is to translate game scene ideas into complete, production-ready Godot Engine instructions, modular node hierarchies, full GDScript code files, a valid Godot .tscn file, and structured GitHub issues and milestones for automated project management.

Rules:
1. Target Godot Version: ${brief.godotVersion || 'Godot 4.3'}. Use strict Godot 4 syntax (e.g. @export, CharacterBody3D, move_and_slide(), TileMapLayer, GPUParticles3D).
2. Node Hierarchy: Create a realistic, logically nested Godot Node tree (Node3D/Node2D root, physics bodies, collision shapes, lighting, environment, camera, particles, sound, state machines).
3. GDScript Files: Provide complete, functional GDScript code for key nodes (player controllers, boss state machines, interaction areas, camera scripts) with signals, @export variables, and proper physics methods.
4. TSCN Content: Generate valid text-based Godot .tscn scene file contents.
5. GitHub Automated Tasks: Create 3-5 structured GitHub Milestones and 4-8 detailed GitHub Issues. Each issue MUST include acceptance criteria, Godot Editor manual setup instructions, labels (e.g., ["godot-4", "gdscript", "physics"]), and markdown description formatted for GitHub project boards.
6. Output MUST be valid JSON conforming strictly to the requested structure. Do not surround with markdown codeblocks if responseMimeType is application/json.`;

    const promptMessage = `Game Scene Concept: "${brief.prompt}"
Genre: ${brief.genre || 'Action / Adventure'}
Camera Mode: ${brief.cameraMode || '3D'}
Godot Version: ${brief.godotVersion || 'Godot 4.3'}

Generate the complete Godot Scene Architecture & GitHub Automated Project Plan.`;

    // Construct the schema with bounded node item nesting level (5)
    const schemaForGemini = translatedScenePlanSchema.extend({
      nodeHierarchy: z.array(boundedNodeItemSchema(5)).default([]),
    });
    const responseSchema = zodToGeminiSchema(schemaForGemini);

    const startedAt = Date.now();
    const request = (feedback = '') => ai.models.generateContent({
      model: modelName,
      contents: feedback ? `${promptMessage}\n\n${feedback}` : promptMessage,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        abortSignal: signal,
      },
    });
    let response = await request();
    const pipeline = await resolvePlan<TranslatedScenePlan>(
      response.text || '{}',
      async (feedback) => {
        response = await request(feedback);
        return response.text || '{}';
      },
      {
        parser: parseTranslatedScenePlan,
        maxRepairAttempts: 1,
      },
    );
    const latencyMs = Date.now() - startedAt;

    const usage = response.usageMetadata
      ? {
          inputTokens: response.usageMetadata.promptTokenCount,
          outputTokens: response.usageMetadata.candidatesTokenCount,
        }
      : undefined;

    return {
      raw: pipeline.rawText,
      data: pipeline.data,
      issues: pipeline.issues,
      usage,
      timings: {
        startedAt,
        latencyMs,
      },
    };
  }

  async refineNode(
    req: RefineRequest,
    opts: { apiKey?: string; baseUrl?: string; model?: string },
    signal?: AbortSignal
  ): Promise<ProviderResult<RefineResult>> {
    const apiKey = opts.apiKey;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = opts.model || this.defaultModel;

    const systemInstruction =
      'You are a Godot GDScript expert. Return valid JSON containing updated GDScript code, editor instructions, and explanation.';

    const promptMessage = `Scene Context: ${req.sceneContext || 'Godot Scene'}
Node Name: ${req.nodeName}
Existing Script (if any):
\`\`\`gdscript
${req.currentScript || '# No script currently'}
\`\`\`

User Refinement Request: "${req.userInstructions}"

Generate an updated or expanded GDScript code block along with step-by-step Godot editor configuration instructions and an updated GitHub issue body.`;

    const responseSchema = zodToGeminiSchema(refineResultSchema);

    const startedAt = Date.now();
    const request = (feedback = '') => ai.models.generateContent({
      model: modelName,
      contents: feedback ? `${promptMessage}\n\n${feedback}` : promptMessage,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        abortSignal: signal,
      },
    });
    let response = await request();
    const pipeline = await resolvePlan<RefineResult>(
      response.text || '{}',
      async (feedback) => {
        response = await request(feedback);
        return response.text || '{}';
      },
      { parser: parseRefineResult, maxRepairAttempts: 1 },
    );
    const latencyMs = Date.now() - startedAt;

    const usage = response.usageMetadata
      ? {
          inputTokens: response.usageMetadata.promptTokenCount,
          outputTokens: response.usageMetadata.candidatesTokenCount,
        }
      : undefined;

    return {
      raw: pipeline.rawText,
      data: pipeline.data,
      issues: pipeline.issues,
      usage,
      timings: {
        startedAt,
        latencyMs,
      },
    };
  }
}
