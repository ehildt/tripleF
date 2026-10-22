import { describe, expect, it } from 'vitest';

import { buildExtractionCorrectionPrompt, buildExtractionPrompt } from './vectorize-prompt.constant.js';

describe('buildExtractionPrompt', () => {
  it('is verdict-first: remember gates every record before embedding', () => {
    const prompt = buildExtractionPrompt();

    expect(prompt).toContain('VERDICT FIRST');
    expect(prompt).toContain('"remember" is the gate');
    expect(prompt).toContain('Most ordinary turns are remember=false');
    expect(prompt).toContain('facts, tags, category, and community are ALL empty');
    expect(prompt).toContain('remember=true REQUIRES at least one fact');
  });

  it('bars one-off requests and inverts the doubt rule to a drop-bias', () => {
    const prompt = buildExtractionPrompt();

    expect(prompt).toContain('ONE-OFF REQUESTS ARE NEVER FACTS');
    expect(prompt).toContain('the user wants to find / watch / buy / do');
    expect(prompt).toContain('DROP-BIAS');
    expect(prompt).toContain('when in doubt whether a detail is durable, DROP it');
    expect(prompt).not.toContain('cheaper to store than to lose');
  });

  it('draws the routing boundary: the partition extracts objective facts only', () => {
    const prompt = buildExtractionPrompt();

    expect(prompt).toContain('ROUTING BOUNDARY');
    expect(prompt).toContain('MUST NOT extract subjective user data');
    expect(prompt).toContain('deferred to the cognition tier');
    expect(prompt).toContain('return remember=false');
  });

  it('covers gathered tool data and attached files as judging context', () => {
    const prompt = buildExtractionPrompt();

    expect(prompt).toContain('GATHERED DATA');
    expect(prompt).toContain('Never store tool artifacts');
    expect(prompt).toContain('ATTACHED FILES');
    expect(prompt).toContain('never the mere act of uploading');
  });
});

describe('buildExtractionCorrectionPrompt', () => {
  it('renders the schema-derived shape instead of a hand-written template', () => {
    const prompt = buildExtractionCorrectionPrompt('boom');

    // The shape comes from the zod schema (single source of truth).
    expect(prompt).toContain('"remember"');
    expect(prompt).toContain('"facts"');
    expect(prompt).toContain('"kind"');
    expect(prompt).toContain('"stability"');
    expect(prompt).toContain('"tags"');
  });

  it('states the remember/facts consistency contract explicitly', () => {
    const prompt = buildExtractionCorrectionPrompt('boom');

    expect(prompt).toContain(
      '"remember" is always required and must be true exactly when facts is non-empty, false when it is empty',
    );
  });

  it('contains no placeholder ellipses a weak model could echo verbatim', () => {
    const prompt = buildExtractionCorrectionPrompt('boom');

    // A bare `..` token is exactly what JSON5 rejects (`invalid character '.'`).
    expect(prompt).not.toContain('...');
    expect(prompt).not.toContain('[...]');
  });
});
