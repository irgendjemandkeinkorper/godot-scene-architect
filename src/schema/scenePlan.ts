import { z } from 'zod';

// Camera modes and versions
export const godotCameraModeSchema = z.enum(['3D', '2D', '2.5D']);
export type GodotCameraMode = z.infer<typeof godotCameraModeSchema>;

export const godotVersionSchema = z.enum(['Godot 4.3', 'Godot 4.2', 'Godot 3.5']);
export type GodotVersion = z.infer<typeof godotVersionSchema>;

// Property Schema
export const godotPropertySchema = z.object({
  name: z.string().default(''),
  type: z.string().default(''),
  value: z.coerce.string().default(''),
  description: z.string().optional(),
});
export type GodotProperty = z.infer<typeof godotPropertySchema>;

// Icon category preprocessing with robust lower-casing and fallback to 'node'
const iconCategoryEnum = z.enum(['3d', '2d', 'control', 'node', 'physics', 'audio', 'particles', 'animation', 'environment']);
const iconCategorySchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const lower = val.toLowerCase();
    if (iconCategoryEnum.options.includes(lower as any)) {
      return lower;
    }
  }
  return 'node';
}, iconCategoryEnum).default('node');

// Recursive GodotNodeItem type and schema definition
export type GodotNodeItem = {
  id: string;
  name: string;
  type: string;
  iconCategory: '3d' | '2d' | 'control' | 'node' | 'physics' | 'audio' | 'particles' | 'animation' | 'environment';
  description: string;
  properties: GodotProperty[];
  scriptName?: string;
  scriptContent?: string;
  children?: GodotNodeItem[];
};

export const godotNodeItemSchema: z.ZodType<GodotNodeItem> = z.lazy(() =>
  z.object({
    id: z.string().default(''),
    name: z.string().default('UnnamedNode'),
    type: z.string().default('Node'),
    iconCategory: iconCategorySchema,
    description: z.string().default(''),
    properties: z.array(godotPropertySchema).default([]),
    scriptName: z.string().optional(),
    scriptContent: z.string().optional(),
    children: z.array(z.lazy(() => godotNodeItemSchema)).default([]),
  })
);

// Implementation Module
export const implementationModuleSchema = z.object({
  id: z.string().default(''),
  stageNumber: z.coerce.number().catch(0).default(0),
  title: z.string().default(''),
  description: z.string().default(''),
  estimatedHours: z.coerce.number().catch(0).default(0), // Model-facing-optional fallback
  editorSteps: z.array(z.string()).default([]),
  godotNodesInvolved: z.array(z.string()).default([]),
  keyGdscriptSnippets: z.array(
    z.object({
      filename: z.string().default(''),
      snippet: z.string().default(''),
      explanation: z.string().default(''),
    })
  ).optional(),
});
export type ImplementationModule = z.infer<typeof implementationModuleSchema>;

// GitHub Milestone
const milestoneStateEnum = z.enum(['open', 'closed']);
const milestoneStateSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const lower = val.toLowerCase();
    if (milestoneStateEnum.options.includes(lower as any)) {
      return lower;
    }
  }
  return 'open';
}, milestoneStateEnum).default('open');

export const gitHubMilestoneItemSchema = z.object({
  id: z.string().default(''),
  title: z.string().default(''),
  description: z.string().default(''),
  dueDateWeeks: z.coerce.number().catch(1).default(1),
  state: milestoneStateSchema,
});
export type GitHubMilestoneItem = z.infer<typeof gitHubMilestoneItemSchema>;

// GitHub Issue
const issueTypeEnum = z.enum(['feature', 'architecture', 'scripting', 'art-fx', 'bug']);
const issueTypeSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const lower = val.toLowerCase();
    if (issueTypeEnum.options.includes(lower as any)) {
      return lower;
    }
  }
  return 'feature';
}, issueTypeEnum).default('feature');

const issueStatusEnum = z.enum(['todo', 'in_progress', 'review', 'done']);
const issueStatusSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const normalized = val.toLowerCase().replace('-', '_');
    if (issueStatusEnum.options.includes(normalized as any)) {
      return normalized;
    }
  }
  return 'todo';
}, issueStatusEnum).default('todo');

export const gitHubIssueItemSchema = z.object({
  id: z.string().default(''),
  title: z.string().default(''),
  moduleTitle: z.string().default(''),
  milestoneTitle: z.string().default(''),
  type: issueTypeSchema,
  status: issueStatusSchema,
  labels: z.array(z.string()).default([]),
  assigneeRole: z.string().default('Developer'),
  acceptanceCriteria: z.array(z.string()).default([]),
  editorInstructions: z.array(z.string()).default([]), // Optional-ish in practice
  bodyMarkdown: z.string().default(''),
  relatedScript: z.string().optional(),
  githubIssueNumber: z.coerce.number().optional(),
  githubUrl: z.string().optional(),
});
export type GitHubIssueItem = z.infer<typeof gitHubIssueItemSchema>;

// Godot Script File
export const godotScriptFileSchema = z.object({
  filename: z.string().default(''),
  nodeTarget: z.string().default(''),
  description: z.string().default(''),
  code: z.string().default(''),
});
export type GodotScriptFile = z.infer<typeof godotScriptFileSchema>;

// Translated Scene Plan Schema
export const translatedScenePlanSchema = z.object({
  sceneTitle: z.string().default('Custom Godot Scene'),
  description: z.string().default('AI-generated scene layout for Godot Engine.'),
  genre: z.string().default('Action / Adventure'),
  godotVersion: godotVersionSchema.default('Godot 4.3'),
  cameraMode: godotCameraModeSchema.default('3D'),
  nodeHierarchy: z.array(godotNodeItemSchema).default([]),
  modules: z.array(implementationModuleSchema).default([]),
  gdscripts: z.array(godotScriptFileSchema).default([]),
  tscnContent: z.string().default(''),
  projectGodotContent: z.string().default(''),
  milestones: z.array(gitHubMilestoneItemSchema).default([]),
  issues: z.array(gitHubIssueItemSchema).default([]),
});
export type TranslatedScenePlan = z.infer<typeof translatedScenePlanSchema>;

// Tolerant Scene Plan Parser
export function parseScenePlan(input: unknown): { ok: true; plan: TranslatedScenePlan } | { ok: false; issues: string[] } {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {
      ok: false,
      issues: ['Input is not a valid blueprint object.'],
    };
  }

  const result = translatedScenePlanSchema.safeParse(input);
  if (!result.success) {
    return {
      ok: false,
      issues: result.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`),
    };
  }

  const plan = result.data;
  // Fallback for projectGodotContent if empty
  if (!plan.projectGodotContent) {
    plan.projectGodotContent = `; Engine configuration file for ${plan.godotVersion}\nconfig_version=5\n`;
  }

  return { ok: true, plan };
}

// Depth-bounded node item schema builder for structured outputs that reject recursive schemas
export function boundedNodeItemSchema(maxDepth: number): z.ZodType<any> {
  const baseFields = {
    id: z.string().default(''),
    name: z.string().default('UnnamedNode'),
    type: z.string().default('Node'),
    iconCategory: iconCategorySchema,
    description: z.string().default(''),
    properties: z.array(godotPropertySchema).default([]),
    scriptName: z.string().optional(),
    scriptContent: z.string().optional(),
  };

  if (maxDepth <= 0) {
    return z.object({
      ...baseFields,
    });
  }

  function buildSchema(currentDepth: number): z.ZodType<any> {
    if (currentDepth >= maxDepth) {
      return z.object({
        ...baseFields,
      });
    }
    return z.object({
      ...baseFields,
      children: z.array(buildSchema(currentDepth + 1)).default([]),
    });
  }

  return buildSchema(0);
}
