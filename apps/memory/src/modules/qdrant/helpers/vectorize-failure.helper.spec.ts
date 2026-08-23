import { describe, expect, it } from 'vitest';

import {
  EmbeddingFailureError,
  isPermanentVectorizeError,
} from './vectorize-failure.helper.js';

describe('isPermanentVectorizeError', () => {
  it('classifies embedding 4xx failures as permanent', () => {
    for (const status of [400, 401, 403, 404, 409, 422]) {
      expect(
        isPermanentVectorizeError(
          new EmbeddingFailureError(status, `embed failed (${status})`),
        ),
      ).toBe(true);
    }
  });

  it('treats embed 5xx and rate limits as transient', () => {
    for (const status of [408, 425, 429, 500, 502, 503]) {
      expect(
        isPermanentVectorizeError(
          new EmbeddingFailureError(status, `embed failed (${status})`),
        ),
      ).toBe(false);
    }
  });

  it('classifies Qdrant client errors by their HTTP status', () => {
    expect(
      isPermanentVectorizeError({ status: 400, message: 'dimension mismatch' }),
    ).toBe(true);
    expect(
      isPermanentVectorizeError({ status: 503, message: 'unavailable' }),
    ).toBe(false);
  });

  it('treats network/unknown errors as transient', () => {
    expect(isPermanentVectorizeError(new Error('ECONNREFUSED'))).toBe(false);
    expect(isPermanentVectorizeError('something')).toBe(false);
    expect(isPermanentVectorizeError(undefined)).toBe(false);
  });
});
