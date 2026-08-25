import type { LanguageModel } from 'ai';

export type AiSdkConfig = {
  streamChunkTimeoutMs: number;
  streamTotalTimeoutMs: number;
  generateTotalTimeoutMs: number;
  enableSmoothStream: boolean;
  /**
   * Resolve a model name to a provider `LanguageModel`. The consuming app
   * supplies this (e.g. `createOllama(...)(name)`), keeping the library
   * provider-agnostic.
   */
  createModel: (modelName: string) => LanguageModel;
};

export type AiSdkConfigFactory = (...deps: any[]) => Promise<AiSdkConfig> | AiSdkConfig;

export type AiSdkModuleProps = {
  global?: boolean;
  inject?: Array<any>;
  useFactory: AiSdkConfigFactory;
};
