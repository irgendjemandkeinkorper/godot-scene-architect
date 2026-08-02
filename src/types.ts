/**
 * Godot Scene Architect & GitHub Task Generator - Data Types
 * Re-exported from the canonical Zod schema definitions.
 */

import {
  GodotCameraMode,
  GodotVersion,
  GodotProperty,
  GodotNodeItem,
  ImplementationModule,
  GitHubMilestoneItem,
  GitHubIssueItem,
  GodotScriptFile,
  TranslatedScenePlan
} from './schema/scenePlan';

export type {
  GodotCameraMode,
  GodotVersion,
  GodotProperty,
  GodotNodeItem,
  ImplementationModule,
  GitHubMilestoneItem,
  GitHubIssueItem,
  GodotScriptFile,
  TranslatedScenePlan
};

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
