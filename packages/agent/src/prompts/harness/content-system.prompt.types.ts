import type { SourcePolicyConfig } from '../shared/source-policy.prompt.js';

export type ContentSystemPromptParams = {
  template: string;
  instructions?: string;
  tools: string[];
  requiredKeys: string[];
  optionalKeys: string[];
  isImageTask: boolean;
  contextSummary?: string;
  language?: string;
  sources?: SourcePolicyConfig;
};
