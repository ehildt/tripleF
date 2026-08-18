import type { MediaUrlKind } from '../helpers/media-classification/classify-by-content-type.helper.js';

export interface MediaValidationResult {
  url: string;
  kind: MediaUrlKind;
  status?: number;
  contentType?: string;
  error?: string;
}

export interface CacheEntry {
  result: MediaValidationResult;
  expiresAt: number;
}
