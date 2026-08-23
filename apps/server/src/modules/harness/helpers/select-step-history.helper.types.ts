import type { InputMessage } from '../../ai-sdk/types/ai-sdk-messages.types.js';

export type StepHistorySelection = {
  messages: InputMessage[];
  mode: 'full' | 'derived';
};

export type SelectStepHistoryParams = {
  messages: InputMessage[];
  template?: string;
};
