import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { zodToGeminiSchema, GeminiProvider } from './gemini';
import { boundedNodeItemSchema } from '../schema/scenePlan';

const { mockGenerateContent } = vi.hoisted(() => {
  return {
    mockGenerateContent: vi.fn().mockResolvedValue({
      text: '{"sceneTitle": "Mock Scene"}',
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20,
      },
    }),
  };
});

// Mock @google/genai cleanly using Vitest hoisted variables
vi.mock('@google/genai', () => {
  return {
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      ARRAY: 'ARRAY',
      INTEGER: 'INTEGER',
      NUMBER: 'NUMBER',
      BOOLEAN: 'BOOLEAN',
      NULL: 'NULL',
    },
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      };
    }),
  };
});

describe('Gemini Schema Converter & Adapter', () => {
  it('should convert a simple object schema to Gemini Type form', () => {
    const simpleSchema = z.object({
      name: z.string(),
      age: z.number().int(),
      score: z.number(),
      isActive: z.boolean(),
      tags: z.array(z.string()),
    });

    const result = zodToGeminiSchema(simpleSchema);

    expect(result.type).toBe('OBJECT');
    expect(result.properties.name.type).toBe('STRING');
    expect(result.properties.age.type).toBe('INTEGER');
    expect(result.properties.score.type).toBe('NUMBER');
    expect(result.properties.isActive.type).toBe('BOOLEAN');
    expect(result.properties.tags.type).toBe('ARRAY');
    expect(result.properties.tags.items.type).toBe('STRING');
    expect(result.required).toContain('name');
    expect(result.required).toContain('age');
  });

  it('should support non-recursive nested children limit (5 levels) for boundedNodeItemSchema', () => {
    const nodeSchema = boundedNodeItemSchema(5);
    const result = zodToGeminiSchema(nodeSchema);

    // Verify root children
    expect(result.properties.children).toBeDefined();
    expect(result.properties.children.type).toBe('ARRAY');

    // Level 1 children items
    const level1 = result.properties.children.items;
    expect(level1.type).toBe('OBJECT');
    expect(level1.properties.children.type).toBe('ARRAY');

    // Level 2
    const level2 = level1.properties.children.items;
    expect(level2.type).toBe('OBJECT');
    expect(level2.properties.children.type).toBe('ARRAY');

    // Level 3
    const level3 = level2.properties.children.items;
    expect(level3.type).toBe('OBJECT');
    expect(level3.properties.children.type).toBe('ARRAY');

    // Level 4
    const level4 = level3.properties.children.items;
    expect(level4.type).toBe('OBJECT');
    expect(level4.properties.children.type).toBe('ARRAY');

    // Level 5 (limit reached, children must be omitted or not defined)
    const level5 = level4.properties.children.items;
    expect(level5.type).toBe('OBJECT');
    expect(level5.properties.children).toBeUndefined();
  });

  it('should gracefully handle empty or mock response from generateScenePlan', async () => {
    const provider = new GeminiProvider();

    const result = await provider.generateScenePlan(
      {
        prompt: 'test',
        genre: 'Action',
        cameraMode: '3D',
        godotVersion: 'Godot 4.3',
      },
      { apiKey: 'mock-key' }
    );

    expect(result.data?.sceneTitle).toBe('Mock Scene');
    expect(result.usage?.inputTokens).toBe(10);
    expect(result.usage?.outputTokens).toBe(20);
    expect(result.timings.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
