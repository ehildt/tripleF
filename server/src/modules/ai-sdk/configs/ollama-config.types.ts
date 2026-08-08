export interface OllamaConnectionConfig {
  host?: string;
  apiKey?: string;
}

export type OllamaConfig = {
  host?: string;
  apiKey?: string;
  keepAlive: string;
  streamChunkTimeoutMs: number;
  streamTotalTimeoutMs: number;
  generateTotalTimeoutMs: number;
  enableSmoothStream: boolean;
};
