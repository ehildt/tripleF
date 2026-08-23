import type { SourcesConfig } from '../../provider-overrides/configs/sources-config.adapter.js';

export type ContentSystemPromptParams = {
  template: string;
  instructions?: string;
  tools: string[];
  requiredKeys: string[];
  optionalKeys: string[];
  isImageTask: boolean;
  contextSummary?: string;
  language?: string;
  sources?: SourcesConfig;
};
