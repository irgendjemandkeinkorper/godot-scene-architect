import { describe, expect, it } from 'vitest';
import { hashBrief } from './types';
import { estimateCost } from './cost';

const brief = { prompt: 'Arena', genre: 'Action', cameraMode: '3D' as const, godotVersion: 'Godot 4.3' as const };

describe('run helpers', () => {
  it('hashes equivalent briefs identically and changes when a field changes', () => {
    expect(hashBrief({ ...brief })).toBe(hashBrief({ ...brief }));
    expect(hashBrief({ ...brief, genre: 'Horror' })).not.toBe(hashBrief(brief));
  });

  it('estimates cost from token usage and per-million-token pricing', () => {
    expect(estimateCost({ inputTokens: 1_000_000, outputTokens: 500_000 }, {
      inputUsdPerMTok: 1,
      outputUsdPerMTok: 2,
      asOf: '2026-01-01',
    })).toBe(2);
  });

  it('leaves cost undefined when usage or pricing is unavailable', () => {
    expect(estimateCost(undefined, undefined)).toBeUndefined();
    expect(estimateCost({ inputTokens: 10 }, { inputUsdPerMTok: 1, outputUsdPerMTok: 1, asOf: '2026-01-01' })).toBeUndefined();
  });
});
