import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { DEFAULT_PREPROCESSING_SETTINGS } from '../../../../stores/preprocessing';
import { extractPreprocessingSettings } from './extract-preprocessing-settings.helper';

const makeEntry = (payload: DlqEntry['payload']): DlqEntry =>
  ({
    requestId: 'req-1',
    queueName: 'harness',
    jobId: null,
    status: 'Failed',
    payload,
    failedReason: null,
    failedAt: null,
    attemptsMade: 0,
    totalAttempts: 3,
    nextRetryAt: null,
    createdAt: '',
  }) as DlqEntry;

describe('extractPreprocessingSettings', () => {
  it('returns the default settings when no preprocessing block is set', () => {
    const result = extractPreprocessingSettings(makeEntry({ filters: {} }));
    expect(result).toEqual(DEFAULT_PREPROCESSING_SETTINGS);
  });

  it('returns the default settings for a null entry', () => {
    expect(extractPreprocessingSettings(null)).toEqual(
      DEFAULT_PREPROCESSING_SETTINGS,
    );
  });

  it('returns the persisted settings when set', () => {
    const result = extractPreprocessingSettings(
      makeEntry({
        filters: {
          preprocessing: {
            enabled: true,
            resize: { maxWidth: 800, maxHeight: 600, withoutEnlargement: true },
            variants: { original: true, grayscale: false },
            parameters: { blurSigma: 1.5 },
          },
        },
      }),
    );
    expect(result.enabled).toBe(true);
    expect(result.resize.maxWidth).toBe(800);
    expect(result.parameters.blurSigma).toBe(1.5);
  });
});
