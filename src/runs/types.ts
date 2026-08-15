import { SceneBrief, ProviderUsage } from '../providers/types';
import { TranslatedScenePlan } from '../types';

export type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface Run {
  id: string;
  briefHash: string;
  brief: SceneBrief;
  provider: string;
  model: string;
  status: RunStatus;
  startedAt: number;
  latencyMs?: number;
  usage?: ProviderUsage;
  costEstimateUSD?: number;
  error?: string;
  plan?: TranslatedScenePlan;
}

export function hashBrief(brief: SceneBrief): string {
  const input = [brief.prompt, brief.genre, brief.cameraMode, brief.godotVersion].join('\u001f');
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
