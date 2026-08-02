/**
 * Godot Scene Architect & GitHub Task Generator - Data Types
 */

export type GodotCameraMode = '3D' | '2D' | '2.5D';
export type GodotVersion = 'Godot 4.3' | 'Godot 4.2' | 'Godot 3.5';

export interface GodotProperty {
  name: string;
  type: string; // e.g. "Vector3", "Color", "Resource", "bool", "enum"
  value: string;
  description?: string;
}

export interface GodotNodeItem {
  id: string;
  name: string;
  type: string; // e.g., "Node3D", "CharacterBody3D", "WorldEnvironment", "DirectionalLight3D", "Area3D", "GPUParticles3D"
  iconCategory: '3d' | '2d' | 'control' | 'node' | 'physics' | 'audio' | 'particles' | 'animation' | 'environment';
  description: string;
  properties: GodotProperty[];
  scriptName?: string;
  scriptContent?: string;
  children?: GodotNodeItem[];
}

export interface ImplementationModule {
  id: string;
  stageNumber: number;
  title: string;
  description: string;
  estimatedHours: number;
  editorSteps: string[];
  godotNodesInvolved: string[];
  keyGdscriptSnippets?: {
    filename: string;
    snippet: string;
    explanation: string;
  }[];
}

export interface GitHubMilestoneItem {
  id: string;
  title: string;
  description: string;
  dueDateWeeks: number;
  state: 'open' | 'closed';
}

export interface GitHubIssueItem {
  id: string;
  title: string;
  moduleTitle: string;
  milestoneTitle: string;
  type: 'feature' | 'architecture' | 'scripting' | 'art-fx' | 'bug';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  labels: string[];
  assigneeRole: string;
  acceptanceCriteria: string[];
  editorInstructions: string[];
  bodyMarkdown: string;
  relatedScript?: string;
  githubIssueNumber?: number;
  githubUrl?: string;
}

export interface GodotScriptFile {
  filename: string;
  nodeTarget: string;
  description: string;
  code: string;
}

export interface TranslatedScenePlan {
  sceneTitle: string;
  description: string;
  genre: string;
  godotVersion: GodotVersion;
  cameraMode: GodotCameraMode;
  nodeHierarchy: GodotNodeItem[];
  modules: ImplementationModule[];
  gdscripts: GodotScriptFile[];
  tscnContent: string;
  projectGodotContent: string;
  milestones: GitHubMilestoneItem[];
  issues: GitHubIssueItem[];
}

export interface GitHubSyncConfig {
  owner: string;
  repo: string;
  token: string;
}

export interface GitHubSyncResult {
  success: boolean;
  message: string;
  createdMilestones: { title: string; number: number; url: string }[];
  createdIssues: { title: string; number: number; url: string }[];
  errors?: string[];
}
