import { describe, expect, it } from 'vitest';

import { buildIntentSelectionPrompt } from './intent-selection.prompt.js';

describe('buildIntentSelectionPrompt', () => {
  it('includes the role of the classifier', () => {
    const prompt = buildIntentSelectionPrompt([]);

    expect(prompt).toContain('deterministic intent-classification engine');
    expect(prompt).toContain('output ONLY valid JSON');
    expect(prompt).toContain('contextSummary');
  });

  it('includes the template catalog', () => {
    const prompt = buildIntentSelectionPrompt([]);

    expect(prompt).toContain('article: default');
    expect(prompt).toContain('describe: default, detailed, concise');
  });

  it('mandates news template for explicit news keywords', () => {
    const prompt = buildIntentSelectionPrompt([]);

    expect(prompt).toContain(
      'you MUST choose template "news". Never choose "article" for these requests',
    );
    expect(prompt).toContain('"announcements"');
    expect(prompt).toContain('"status"');
    expect(prompt).toContain('It is NOT a 3-sentence summary');
  });

  it('includes grouped tools from the enabled list', () => {
    const prompt = buildIntentSelectionPrompt([
      'webSearch',
      'serperImageSearch',
    ]);

    expect(prompt).toContain('webSearch:');
    expect(prompt).toContain('serperImageSearch:');
  });

  it('lists multimodal and follow-up rules', () => {
    const prompt = buildIntentSelectionPrompt([]);

    expect(prompt).toContain('MULTIMODAL RULES');
    expect(prompt).toContain('FOLLOW-UP / REFINEMENT RULES');
    expect(prompt).toContain('needsClarification=true');
    expect(prompt).toContain(
      'MUST be in the language identified by the "language" field',
    );
  });

  it('lists concrete media tool names and warns about omissions', () => {
    const prompt = buildIntentSelectionPrompt([
      'webSearch',
      'serperImageSearch',
      'serperVideoSearch',
      'serperNewsSearch',
    ]);

    expect(prompt).toContain('include every enabled *ImageSearch tool');
    expect(prompt).toContain('include every enabled *VideoSearch tool');
    expect(prompt).toContain('serperImageSearch');
    expect(prompt).toContain('serperVideoSearch');
    expect(prompt).toContain(
      'the response will fail to render the requested media',
    );
  });

  it('includes news vs article selection examples', () => {
    const prompt = buildIntentSelectionPrompt([]);

    expect(prompt).toContain('TEMPLATE SELECTION EXAMPLES');
    expect(prompt).toContain('"What is the latest news on Gaza?"');
    expect(prompt).toContain('template: "news"');
    expect(prompt).toContain(
      '"Write an in-depth report on the Gaza conflict."',
    );
    expect(prompt).toContain('template: "article"');
  });
});
