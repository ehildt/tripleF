import { describe, expect, it } from 'vitest';

import { parseCollapsedSections } from './parse-collapsed-sections.helper';

describe('parseCollapsedSections', () => {
  it('applies valid saved booleans over defaults', () => {
    expect(
      parseCollapsedSections(
        '{"sources":true,"keyFindings":true,"internationalCoverage":false}',
      ),
    ).toEqual({
      sources: true,
      keyFindings: true,
      internationalCoverage: false,
    });
  });

  it('ignores malformed fields and corrupt JSON', () => {
    expect(parseCollapsedSections('{"sources":"yes"}')).toEqual({
      sources: false,
      keyFindings: false,
      internationalCoverage: false,
    });
    expect(parseCollapsedSections('{')).toEqual({
      sources: false,
      keyFindings: false,
      internationalCoverage: false,
    });
  });
});
