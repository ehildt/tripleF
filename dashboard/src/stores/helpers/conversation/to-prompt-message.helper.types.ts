import type { HarnessResponseData } from '../../../types/harness-response-data.model';

export interface PromptExchange {
  role: string;
  content: string;
  text?: string;
  harnessTemplate?: string;
  harnessData?: HarnessResponseData;
  images?: Array<{ name: string; hash: string }>;
}

export interface PromptMessage {
  role: string;
  content: string;
}

export interface ToPromptMessageOptions {
  /**
   * Prefix structured assistant answers with their `[Template: <name>]`
   * marker so the intent classifier can resolve follow-ups against the
   * template that produced them (default true). The free-form `text`
   * template is never marked — it is the default routing anyway.
   */
  includeTemplateMarker?: boolean;
}
