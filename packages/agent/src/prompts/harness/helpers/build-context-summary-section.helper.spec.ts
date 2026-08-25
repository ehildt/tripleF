import { describe, expect, it } from 'vitest';

import { buildContextSummarySection } from './build-context-summary-section.helper.js';

describe('buildContextSummarySection', () => {
  it('frames the summary as earlier-turn reference data', () => {
    const section = buildContextSummarySection('Subject: the game Neverness to Everness (NTE).');

    expect(section).toContain('CONTEXT SUMMARY (earlier conversation turns — may be unrelated to the current request)');
    expect(section).toContain('Subject: the game Neverness to Everness (NTE).');
  });

  it('forbids mixing the summary into an unrelated current subject', () => {
    const section = buildContextSummarySection('Some earlier topic.');

    expect(section).toContain('Use this summary ONLY when the latest message explicitly refers to earlier content');
    expect(section).toContain('Never mix its URLs, sources, media, or facts');
  });

  it('instructs folding the established subject into every search query', () => {
    const section = buildContextSummarySection('Some earlier topic.');

    expect(section).toContain(
      'fold the established subject and entities from this summary into every search query built for it, so each query names its subject explicitly',
    );
  });
});
