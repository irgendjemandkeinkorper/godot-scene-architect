import { parseScenePlan } from '../schema/scenePlan';

export type PipelineParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; issues: string[] };

export interface PipelineResult<T> {
  ok: boolean;
  data?: T;
  issues?: string[];
  rawText: string;
}

export interface ResolvePlanOptions<T> {
  maxRepairAttempts?: number;
  parser?: (input: unknown) => PipelineParseResult<T>;
}

const MAX_RETRY_CONTEXT_BYTES = 20 * 1024;

function extractJson(rawText: string): { value?: unknown; issues?: string[] } {
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = (fenced || rawText).trim();

  try {
    return { value: JSON.parse(candidate) };
  } catch {
    // Try a balanced object below; model prose often surrounds otherwise-valid JSON.
  }

  const start = candidate.indexOf('{');
  if (start < 0) {
    return { issues: ['Model output did not contain a JSON object.'] };
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < candidate.length; index += 1) {
    const char = candidate[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          return { value: JSON.parse(candidate.slice(start, index + 1)) };
        } catch {
          return { issues: ['Model output contained an invalid JSON object.'] };
        }
      }
    }
  }

  return { issues: ['Model output contained truncated JSON.'] };
}

function parseOutput<T>(rawText: string, parser: (input: unknown) => PipelineParseResult<T>) {
  const extracted = extractJson(rawText);
  if (extracted.issues) return { ok: false as const, issues: extracted.issues };
  return parser(extracted.value);
}

export async function resolvePlan<T = ReturnType<typeof parseScenePlan> extends { ok: true; data: infer P } ? P : never>(
  rawText: string,
  retryFn: (feedback: string) => Promise<string>,
  options: ResolvePlanOptions<T> = {},
): Promise<PipelineResult<T>> {
  const parser = options.parser || (parseScenePlan as unknown as (input: unknown) => PipelineParseResult<T>);
  const maxRepairAttempts = Math.max(0, options.maxRepairAttempts ?? 1);
  let currentRawText = rawText;
  let parsed = parseOutput(currentRawText, parser);

  for (let attempt = 0; attempt < maxRepairAttempts; attempt += 1) {
    if (!('issues' in parsed)) break;
    const outputContext = currentRawText.length <= MAX_RETRY_CONTEXT_BYTES
      ? `\nPrevious invalid output:\n${currentRawText}`
      : '';
    const feedback = `Your previous output failed validation: ${parsed.issues.join('; ')}. Return corrected JSON only.${outputContext}`;
    currentRawText = await retryFn(feedback);
    parsed = parseOutput(currentRawText, parser);
  }

  if (!('issues' in parsed)) {
    return { ok: true, data: parsed.data, rawText: currentRawText };
  }
  return { ok: false, issues: parsed.issues, rawText: currentRawText };
}
