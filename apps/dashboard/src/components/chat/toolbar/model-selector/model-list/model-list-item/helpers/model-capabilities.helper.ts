import type { OllamaModel } from '@/types/ollama-model.model';

/**
 * Capabilities worth advertising in the model selector, in a stable display
 * order: senses (vision, audio), then abilities (tools, thinking), then the
 * baseline completion capability. `insert` from the Ollama capability list
 * is fill-in-the-middle noise, so it is excluded.
 */
const SELECTOR_CAPABILITIES = [
  'vision',
  'audio',
  'tools',
  'thinking',
  'completion',
] as const;

export type ModelCapability = (typeof SELECTOR_CAPABILITIES)[number];

/**
 * The subset of selector-relevant capabilities a model supports, in the
 * stable display order — an empty list for models without any of them.
 */
export function modelCapabilities(model: OllamaModel): ModelCapability[] {
  const capabilities = model.capabilities ?? [];
  return SELECTOR_CAPABILITIES.filter((capability) =>
    capabilities.includes(capability),
  );
}
