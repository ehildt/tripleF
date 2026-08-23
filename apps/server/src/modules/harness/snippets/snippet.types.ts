import type { ZodTypeAny } from 'zod';

import type { ResponseLayout } from './response-layout.constant.js';

/**
 * One response-building snippet: the zod field fragment it contributes to
 * the composed template schema (the keys double as the output-contract key
 * list) plus the prompt block that tells the model what the snippet is for,
 * what input it needs, and its writing contract.
 *
 * The client renders one Vue section per snippet from the JSON fields.
 */
export interface TemplateSnippet {
  /** Ordered zod field fragments merged into the composed schema. */
  fields: Record<string, ZodTypeAny>;
  /** Instruction block injected into the respond-step system prompt. */
  instruction: string;
}

/**
 * A snippet-composed template (news, article, evaluation): a required
 * non-empty spine plus an ordered set of optional snippets the model
 * fills when it can substantiate them from the retrieved data.
 */
export interface SnippetTemplatePreset {
  /** Template name as used across the harness pipeline. */
  template: string;
  /** Required non-empty spine keys (`layout` is added by the composer). */
  spineKeys: string[];
  /** Ordered snippets; order doubles as the preferred key emission order. */
  snippets: TemplateSnippet[];
  /** Layouts the preset can express; the user config narrows this further. */
  supportedLayouts: ResponseLayout[];
  /** Fields concatenated for the server-side read-time estimate. */
  readTimeKeys?: string[];
}
