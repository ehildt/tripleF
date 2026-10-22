import { z } from 'zod';

/**
 * Validates the serializable `MemoryClientConfig` env output. Looser than
 * the interface on purpose: url and enabled are optional at this boundary
 * (adapters fall back to defaults).
 */
export const MemoryClientConfigSchema = z.strictObject({
  url: z.url().optional(),
  enabled: z.boolean().optional(),
});
