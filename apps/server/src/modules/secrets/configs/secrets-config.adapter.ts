import { z } from 'zod';

const hexKey = z.hex().length(64);

export const SecretsConfigSchema = z.strictObject({
  /** Active master key (hex, 32 bytes) — encrypts and decrypts. */
  activeKey: hexKey.optional(),
  /** Retired master key (hex, 32 bytes) — decrypts only, for rotation. */
  previousKey: hexKey.optional(),
});

/**
 * Master-key material for the secrets cipher. Derived from the schema, so
 * the type can never drift from the runtime contract.
 */
export type SecretsConfig = z.infer<typeof SecretsConfigSchema>;

export function SecretsConfigAdapter(env = process.env): SecretsConfig {
  return {
    activeKey: env.TRIPLEF_SECRETS_KEY || undefined,
    previousKey: env.TRIPLEF_SECRETS_KEY_PREVIOUS || undefined,
  };
}
