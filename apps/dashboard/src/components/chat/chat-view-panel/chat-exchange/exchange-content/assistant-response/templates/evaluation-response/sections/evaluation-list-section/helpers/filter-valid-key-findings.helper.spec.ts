import { describe, expect, it } from 'vitest';

import type { KeyFinding } from '@/types/harness-response-data.model';

import { filterValidKeyFindings } from './filter-valid-key-findings.helper';

describe('filterValidKeyFindings', () => {
  it('keeps findings with non-empty text', () => {
    expect(
      filterValidKeyFindings([
        { text: 'Fast' },
        { text: '  ' },
        { text: 'Quiet' },
      ]),
    ).toEqual([{ text: 'Fast' }, { text: 'Quiet' }]);
  });

  it('returns an empty list for undefined input', () => {
    expect(filterValidKeyFindings(undefined)).toEqual([]);
  });

  it('drops non-object entries', () => {
    expect(filterValidKeyFindings([null as unknown as KeyFinding])).toEqual([]);
  });
});
