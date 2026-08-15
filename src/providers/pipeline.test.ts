import { describe, expect, it, vi } from 'vitest';
import { resolvePlan } from './pipeline';

const parseObject = (input: unknown) => {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false as const, issues: ['Expected an object.'] };
  }
  const value = input as { name?: unknown };
  if (typeof value.name !== 'string') {
    return { ok: false as const, issues: ['name: Expected a string.'] };
  }
  return { ok: true as const, data: { name: value.name } };
};

describe('resolvePlan', () => {
  it('extracts fenced JSON and validates it', async () => {
    const result = await resolvePlan('Here is the plan:\n```json\n{"name":"Arena"}\n```', vi.fn(), {
      parser: parseObject,
    });

    expect(result).toEqual({ ok: true, data: { name: 'Arena' }, rawText: expect.any(String) });
  });

  it('salvages JSON with leading prose and braces inside strings', async () => {
    const result = await resolvePlan('The answer is {"name":"code { brace }"} thanks.', vi.fn(), {
      parser: parseObject,
    });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ name: 'code { brace }' });
  });

  it('repairs invalid output once and returns the repaired result', async () => {
    const retry = vi.fn().mockResolvedValue('{"name":"Repaired"}');
    const result = await resolvePlan('{"name":42}', retry, { parser: parseObject });

    expect(result).toEqual({ ok: true, data: { name: 'Repaired' }, rawText: '{"name":"Repaired"}' });
    expect(retry).toHaveBeenCalledTimes(1);
    expect(retry.mock.calls[0][0]).toContain('name: Expected a string.');
  });

  it('returns a structured failure after retries are exhausted', async () => {
    const retry = vi.fn().mockResolvedValue('{"name":42}');
    const result = await resolvePlan('{"name":42}', retry, { parser: parseObject, maxRepairAttempts: 1 });

    expect(result).toEqual({
      ok: false,
      issues: ['name: Expected a string.'],
      rawText: '{"name":42}',
    });
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('does not retry a valid plan', async () => {
    const retry = vi.fn();
    const result = await resolvePlan('{"name":"Valid"}', retry, { parser: parseObject, maxRepairAttempts: 2 });

    expect(result.ok).toBe(true);
    expect(retry).not.toHaveBeenCalled();
  });
});
