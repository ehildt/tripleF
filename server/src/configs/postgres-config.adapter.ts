import Joi from 'joi';

export interface PostgresConfig {
  url: string;
}

export const PostgresConfigSchema = Joi.object<PostgresConfig>({
  url: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
}).required();

export function PostgresConfigAdapter(env = process.env): PostgresConfig {
  return {
    url: env.POSTGRES_URL!,
  };
}
