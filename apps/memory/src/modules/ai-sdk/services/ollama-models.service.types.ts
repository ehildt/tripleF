export type ModelOrigin = 'local' | 'cloud';

export interface ShowResult {
  capabilities?: string[];
  model_info?: Record<string, unknown>;
  details?: {
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface TaggedModel {
  name: string;
  details?: Record<string, unknown>;
  origin: ModelOrigin;
}
