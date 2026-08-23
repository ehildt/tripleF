import Joi from 'joi';

export interface SecretsConfig {
  /** Active master key (hex, 32 bytes) — encrypts and decrypts. */
  activeKey?: string;
  /** Retired master key (hex, 32 bytes) — decrypts only, for rotation. */
  previousKey?: string;
}

const hexKey = Joi.string().hex().length(64);

export const SecretsConfigSchema = Joi.object<SecretsConfig>({
  activeKey: hexKey.optional(),
  previousKey: hexKey.optional(),
}).required();

export function SecretsConfigAdapter(env = process.env): SecretsConfig {
  return {
    activeKey: env.TRIPLEF_SECRETS_KEY || undefined,
    previousKey: env.TRIPLEF_SECRETS_KEY_PREVIOUS || undefined,
  };
}
