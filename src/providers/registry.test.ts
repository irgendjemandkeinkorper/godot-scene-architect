import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerProvider,
  getProvider,
  listProviders,
  clearRegistry,
  getProviderStatus,
} from './registry';
import { Provider, ProviderResult } from './types';
import { TranslatedScenePlan } from '../types';

describe('Provider Registry & Status Matrix', () => {
  beforeEach(() => {
    clearRegistry();
  });

  // Mock Providers for testing the matrix
  const mockGemini: Provider = {
    id: 'gemini',
    label: 'Google Gemini',
    defaultModel: 'gemini-3.6-flash',
    capabilities: {
      structuredOutput: 'native-schema',
      reportsTokens: true,
      browserCallable: true,
      requiresBridge: false,
    },
    async listModels() {
      return ['gemini-3.6-flash'];
    },
    async generateScenePlan() {
      throw new Error('Not implemented');
    },
    async refineNode() {
      throw new Error('Not implemented');
    },
  };

  const mockOllama: Provider = {
    id: 'ollama',
    label: 'Ollama (Local)',
    defaultModel: 'llama3',
    capabilities: {
      structuredOutput: 'json-mode',
      reportsTokens: false,
      browserCallable: false,
      requiresBridge: false,
    },
    async listModels() {
      return ['llama3'];
    },
    async generateScenePlan() {
      throw new Error('Not implemented');
    },
    async refineNode() {
      throw new Error('Not implemented');
    },
  };

  const mockCopilotBridge: Provider = {
    id: 'copilot-bridge',
    label: 'Copilot Bridge',
    defaultModel: 'copilot-model',
    capabilities: {
      structuredOutput: 'prompt-only',
      reportsTokens: false,
      browserCallable: false,
      requiresBridge: true, // Requires bridge server
    },
    async listModels() {
      return ['copilot-model'];
    },
    async generateScenePlan() {
      throw new Error('Not implemented');
    },
    async refineNode() {
      throw new Error('Not implemented');
    },
  };

  it('should register and retrieve providers correctly', () => {
    registerProvider(mockGemini);
    expect(getProvider('gemini')).toBe(mockGemini);
    expect(listProviders()).toContain(mockGemini);
  });

  it('should return unavailable for unregistered providers', () => {
    expect(getProviderStatus('unknown-provider', {})).toBe('unavailable');
  });

  it('should derive correct status for cloud providers requiring API keys', () => {
    registerProvider(mockGemini);

    // Key is absent
    expect(getProviderStatus('gemini', {})).toBe('needs-key');
    expect(getProviderStatus('gemini', { gemini: false })).toBe('needs-key');

    // Key is present
    expect(getProviderStatus('gemini', { gemini: true })).toBe('ready');
  });

  it('should derive correct status for local providers (no key required)', () => {
    registerProvider(mockOllama);

    // Always ready since it does not require an API key or bridge
    expect(getProviderStatus('ollama', {})).toBe('ready');
    expect(getProviderStatus('ollama', { ollama: false })).toBe('ready');
    expect(getProviderStatus('ollama', { ollama: true })).toBe('ready');
  });

  it('should derive correct status for providers requiring a bridge connection', () => {
    registerProvider(mockCopilotBridge);

    // Bridge config is absent
    expect(getProviderStatus('copilot-bridge', {})).toBe('needs-bridge');
    expect(getProviderStatus('copilot-bridge', { 'copilot-bridge': false })).toBe('needs-bridge');

    // Bridge config is present
    expect(getProviderStatus('copilot-bridge', { 'copilot-bridge': true })).toBe('ready');
  });

  it('should enforce type-level flow where TranslatedScenePlan is carried by ProviderResult', () => {
    // Compile-time check: we can declare a variable of type ProviderResult<TranslatedScenePlan>
    const result: ProviderResult<TranslatedScenePlan> = {
      raw: '{}',
      timings: { startedAt: Date.now(), latencyMs: 123 },
    };
    expect(result.raw).toBe('{}');
  });
});
