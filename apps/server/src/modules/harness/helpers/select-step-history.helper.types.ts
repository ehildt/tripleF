import type { InputMessage } from '@triplef/ai-sdk';

export type StepHistorySelection = {
  messages: InputMessage[];
  mode: 'full' | 'derived';
};

export type SelectStepHistoryParams = {
  messages: InputMessage[];
  template?: string;
};
