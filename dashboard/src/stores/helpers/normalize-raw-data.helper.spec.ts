import { describe, expect, it } from 'vitest';

import { normalizeRawData } from './normalize-raw-data.helper';

describe('normalizeRawData', () => {
  it('maps snake_case token fields to camelCase', () => {
    const raw = {
      prompt_eval_count: 10,
      eval_count: 4,
      eval_duration: 2,
      total_duration: 7,
    };

    normalizeRawData(raw);

    expect(raw).toMatchObject({
      promptEvalCount: 10,
      evalCount: 4,
      evalDuration: 2,
      totalDuration: 7,
    });
  });

  it('does not overwrite existing camelCase fields', () => {
    const raw = { prompt_eval_count: 10, promptEvalCount: 99 };

    normalizeRawData(raw);

    expect(raw.promptEvalCount).toBe(99);
  });

  it('leaves payloads without token fields untouched', () => {
    const raw = { requestId: 'r1' };

    normalizeRawData(raw);

    expect(raw).toEqual({ requestId: 'r1' });
  });
});
