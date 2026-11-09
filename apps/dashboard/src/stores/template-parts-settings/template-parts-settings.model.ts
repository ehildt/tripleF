import type { AssistantResponseData } from '@/types/assistant-response-data.model';

export interface TemplatePartDefinition {
  /** Stable part id, also used for the localized Settings label key suffix. */
  id: string;
  /** Response data keys removed when this part is disabled. */
  keys: Array<keyof AssistantResponseData>;
}

/** Harness response templates with client-side part-visibility preferences. */
export type TemplateName =
  | 'article'
  | 'news'
  | 'describe'
  | 'compare'
  | 'ocr'
  | 'summary'
  | 'evaluation'
  | 'product'
  | 'shoplist'
  | 'imagelist'
  | 'videolist'
  | 'stockmarketitem'
  | 'stockmarketlist'
  | 'text';
