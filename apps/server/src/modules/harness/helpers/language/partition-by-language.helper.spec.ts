import { describe, expect, it } from 'vitest';

import { partitionByLanguage } from './partition-by-language.helper.js';

describe('partitionByLanguage', () => {
  it('keeps everything in main when there is no user language', () => {
    const items = [{ lang: 'de' }, { lang: 'en' }, {}];
    expect(partitionByLanguage(items, undefined)).toEqual({
      main: items,
      international: [],
    });
  });

  it('splits foreign-language items into international', () => {
    const items = [{ lang: 'en' }, { lang: 'de' }, { lang: undefined }];
    expect(partitionByLanguage(items, 'en')).toEqual({
      main: [{ lang: 'en' }, { lang: undefined }],
      international: [{ lang: 'de' }],
    });
  });

  it('keeps undetermined items in main', () => {
    const items = [{ lang: 'de' }, {}];
    expect(partitionByLanguage(items, 'en').main).toEqual([{}]);
  });
});
