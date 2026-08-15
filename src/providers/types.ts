import { GodotVersion, GodotCameraMode, TranslatedScenePlan } from '../types';

/**
 * SceneBrief represents the input required to generate a complete Godot scene plan.
 * (Optional creative-direction fields such as art/music direction may be added in later milestones)
 */
export interface SceneBrief {
  prompt: string;
  genre: string;
  cameraMode: GodotCameraMode;
  godotVersion: GodotVersion;
}

/**
 * RefineRequest represents the parameters for the node/script refinement API.
 */
export interface RefineRequest {
  nodeName: string;
  currentScript: string;
  userInstructions: string;
  sceneContext: string;
}

/**
 * RefineResult is the structured response when refining or expanding a GDScript/feature.
 */
export interface RefineResult {
  updatedScript: string;
  explanation: string;
  editorInstructions: string[];
  newGitHubIssue?: {
    title: string;
    labels: string[];
    bodyMarkdown: string;
  };
}

/**
 * ProviderUsage tracks token metrics returned by the AI provider model.
 */
export interface ProviderUsage {
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * ProviderTimings tracks execution metrics such as latency.
 */
export interface ProviderTimings {
  startedAt: number; // Wall-clock start time in ms
  latencyMs: number; // Wall-clock latency in ms
}

/**
 * ProviderResult wraps the structured result from any AI provider execution.
 */
export interface ProviderResult<T> {
  raw: string;
  data?: T;
  issues?: string[];
  usage?: ProviderUsage;
  timings: ProviderTimings;
}

/**
 * ProviderCapabilities describes what a specific provider supports and its environment requirements.
 */
export interface ProviderCapabilities {
  structuredOutput: 'native-schema' | 'json-mode' | 'prompt-only';
  reportsTokens: boolean;
  costTable?: Record<
    string,
    {
      inputUsdPerMTok: number;
      outputUsdPerMTok: number;
      asOf: string;
    }
  >;
  browserCallable: boolean;
  requiresBridge: boolean;
}

/**
 * ProviderOpts specifies run-time options passed when calling a provider method.
 */
export interface ProviderOpts {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

/**
 * Provider defines the uniform interface implemented by all model adapters.
 */
export interface Provider {
  id: string;
  label: string;
  capabilities: ProviderCapabilities;
  defaultModel: string;
  listModels(auth: { apiKey?: string; baseUrl?: string }): Promise<string[]>;
  generateScenePlan(
    brief: SceneBrief,
    opts: ProviderOpts,
    signal?: AbortSignal
  ): Promise<ProviderResult<TranslatedScenePlan>>;
  refineNode(
    req: RefineRequest,
    opts: ProviderOpts,
    signal?: AbortSignal
  ): Promise<ProviderResult<RefineResult>>;
}
