export interface OllamaModel {
  model: string;
  /** Where the model runs: the configured host or Ollama Cloud. */
  origin?: 'local' | 'cloud';
  parameter_size?: string;
  quantization_level?: string;
  family?: string;
  capabilities?: string[];
  context_length?: number;
}
