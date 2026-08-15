import { ProviderUsage } from '../providers/types';

export interface CostTableEntry {
  inputUsdPerMTok: number;
  outputUsdPerMTok: number;
  asOf: string;
}

export function estimateCost(usage: ProviderUsage | undefined, pricing: CostTableEntry | undefined): number | undefined {
  if (!usage || !pricing || usage.inputTokens == null || usage.outputTokens == null) return undefined;
  return (usage.inputTokens * pricing.inputUsdPerMTok + usage.outputTokens * pricing.outputUsdPerMTok) / 1_000_000;
}
