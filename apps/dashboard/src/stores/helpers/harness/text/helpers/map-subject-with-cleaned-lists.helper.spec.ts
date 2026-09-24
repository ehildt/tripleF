import { describe, expect, it } from 'vitest';

import { mapSubjectWithCleanedLists } from './map-subject-with-cleaned-lists.helper';

const filterArray = <T>(
  value: T[] | undefined,
  predicate: (item: T) => boolean,
) => (Array.isArray(value) ? value.filter(predicate) : value);

describe('mapSubjectWithCleanedLists', () => {
  it('drops empty-text strength/weakness entries', () => {
    const result = mapSubjectWithCleanedLists(
      {
        name: 'A',
        strengths: [{ text: 'strong' }, { text: '' }],
        weaknesses: [{ text: 'weak' }, { text: '  ' }],
      },
      filterArray,
    );
    expect(result.strengths).toEqual([{ text: 'strong' }]);
    expect(result.weaknesses).toEqual([{ text: 'weak' }]);
    expect(result.name).toBe('A');
  });
});
