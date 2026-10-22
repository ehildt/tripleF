import { describe, expect, it } from 'vitest';

import { repairSpacedLinks } from './repair-spaced-links.helper';

describe('repairSpacedLinks', () => {
  it('collapses spaces inside a mangled url destination', () => {
    expect(
      repairSpacedLinks(
        '[action-oriented](https://en. wikipedia. org/wiki/Action_film "Action film")',
      ),
    ).toBe(
      '[action-oriented](https://en.wikipedia.org/wiki/Action_film "Action film")',
    );
  });

  it.each([
    {
      scenario: 'destinations without a title',
      source: '[kill count](https://en. wikipedia. org/wiki/Body_count)',
      expected: '[kill count](https://en.wikipedia.org/wiki/Body_count)',
    },
    {
      scenario: 'already-valid links stayed untouched',
      source: '[dogs](https://example.com/dogs "Dogs") and [ref](#cite_note-7)',
      expected:
        '[dogs](https://example.com/dogs "Dogs") and [ref](#cite_note-7)',
    },
    {
      scenario: 'relative destinations',
      source: '[x](/wiki/John_Wick)',
      expected: '[x](/wiki/John_Wick)',
    },
  ])('repairs $scenario', ({ source, expected }) => {
    expect(repairSpacedLinks(source)).toBe(expected);
  });

  it('preserves escaped parens inside the destination', () => {
    expect(
      repairSpacedLinks(
        '[Michael Myers](https://en. wikipedia. org/wiki/Michael_Myers_\\(Halloween\\) "Michael Myers (Halloween)")',
      ),
    ).toBe(
      '[Michael Myers](https://en.wikipedia.org/wiki/Michael_Myers_\\(Halloween\\) "Michael Myers (Halloween)")',
    );
  });

  it('leaves non-URL parentheses untouched', () => {
    const text = 'some text ](see above) more text';
    expect(repairSpacedLinks(text)).toBe(text);
  });

  it('leaves angle-bracket destinations untouched', () => {
    const text = '[x](<https://example.com/two words>)';
    expect(repairSpacedLinks(text)).toBe(text);
  });
});
