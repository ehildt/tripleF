import type { MediaValidationResult } from './media-url-validator.service.js';

export interface CacheEntry {
  result: MediaValidationResult;
  expiresAt: number;
}
