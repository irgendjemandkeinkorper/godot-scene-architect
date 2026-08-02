import { Provider } from './types';
import { GeminiProvider } from './gemini';

export type ProviderStatus = 'ready' | 'needs-key' | 'needs-bridge' | 'unavailable';

const registry = new Map<string, Provider>();

/**
 * Registers an AI provider implementation in the registry.
 */
export function registerProvider(provider: Provider): void {
  registry.set(provider.id, provider);
}

/**
 * Retrieves a registered provider by its unique ID.
 */
export function getProvider(id: string): Provider | undefined {
  return registry.get(id);
}

/**
 * Returns a list of all registered providers.
 */
export function listProviders(): Provider[] {
  return Array.from(registry.values());
}

/**
 * Clears all registered providers (mostly useful for tests).
 */
export function clearRegistry(): void {
  registry.clear();
}

/**
 * Derives the runtime status of a provider based on its capabilities and the presence of necessary keys/bridges.
 * 
 * @param id The unique ID of the provider.
 * @param keyPresence A record mapping provider IDs to a boolean indicating if their required credential or server config is active.
 */
export function getProviderStatus(
  id: string,
  keyPresence: Record<string, boolean>
): ProviderStatus {
  const provider = getProvider(id);
  if (!provider) {
    return 'unavailable';
  }

  // If the provider specifically requires a bridge connection
  if (provider.capabilities.requiresBridge) {
    return keyPresence[id] ? 'ready' : 'needs-bridge';
  }

  // Cloud-based providers require an API key to function.
  // Ollama is local-only and does not require an API key.
  const requiresKey = provider.id !== 'ollama';
  if (requiresKey) {
    return keyPresence[id] ? 'ready' : 'needs-key';
  }

  return 'ready';
}

// Register default providers on initialization
registerProvider(new GeminiProvider());
