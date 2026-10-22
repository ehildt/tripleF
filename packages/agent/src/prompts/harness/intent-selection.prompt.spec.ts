import { describe, expect, it } from 'vitest';

import { buildIntentSelectionPrompt } from './intent-selection.prompt.js';

describe('buildIntentSelectionPrompt', () => {
  it('instructs the probe duty and routes all writes to the automatic background pass', () => {
    const prompt = buildIntentSelectionPrompt(['memory-partition-recall']);

    expect(prompt).toContain('MEMORY RULES');
    expect(prompt).toContain('active growth loop');
    // The probe is unconditional: the classifier can't know whether user
    // memory exists without checking, so memory-partition-recall is included
    // in EVERY request when memory tools are enabled — never gated on topic.
    expect(prompt).toContain('ALWAYS-PROBE');
    expect(prompt).toContain('include the enabled memory-partition-recall tool in EVERY request');
    // Writing is automatic and judged: a background pass after every turn
    // decides what is worth persisting — no write tool is ever selected.
    expect(prompt).toContain('AUTOMATIC WRITE');
    expect(prompt).toContain('persisting needs NO tool');
    expect(prompt).toContain('Never claim you stored something during the turn');
    expect(prompt).not.toContain('memory-partition-remember');
    expect(prompt).not.toContain('memory-cognition-remember');
    // The probe is never replaced by web search.
    expect(prompt).toContain('never replace memory-partition-recall with web search');
    expect(prompt).toContain('CONTINUATION');
    // Restating a stored record updates it in place via the automatic pass.
    expect(prompt).toContain('UPDATE-LOOP');
    expect(prompt).toContain('restating a stored record updates it in place, never duplicates it');
  });

  it('enforces the tier boundary: subjective user data to cognition, objective facts to the partition', () => {
    const prompt = buildIntentSelectionPrompt(['memory-partition-recall', 'memory-cognition-delete']);

    // The lanes are defined by subjectivity, not by who said it.
    expect(prompt).toContain('memory-partition = the OBJECTIVE fact store');
    expect(prompt).toContain('memory-cognition = the SUBJECTIVE profile store');
    expect(prompt).toContain('subjective user data NEVER goes to the partition');
    // Targeted deletion covers both lanes; the wipe stays for starting over.
    expect(prompt).toContain('FORGET A PREFERENCE');
    expect(prompt).toContain('memory-cognition-delete');
    expect(prompt).toContain('memory-cognition-delete is the targeted path');
  });

  it('disambiguates familiarity questions from memory questions', () => {
    const prompt = buildIntentSelectionPrompt([]);

    expect(prompt).toContain('FAMILIARITY QUESTION RULES');
    expect(prompt).toContain('only when the subject is public world knowledge');
  });

  it('includes the role of the classifier', () => {
    const prompt = buildIntentSelectionPrompt([]);

    expect(prompt).toContain('deterministic intent-classification engine');
    expect(prompt).toContain('output ONLY valid JSON');
    expect(prompt).toContain('contextSummary');
  });

  it('requires verbatim entities so later steps can cite them in standalone queries', () => {
    const prompt = buildIntentSelectionPrompt([]);

    expect(prompt).toContain('the established topic/entities verbatim');
    expect(prompt).toContain('cite them word-for-word in standalone search queries');
  });

  it('includes the template catalog', () => {
    const prompt = buildIntentSelectionPrompt([]);

    expect(prompt).toContain('article: default');
    expect(prompt).toContain('describe: default, detailed, concise');
  });

  it('mandates news template for explicit news keywords', () => {
    const prompt = buildIntentSelectionPrompt([]);

    expect(prompt).toContain('you MUST choose template "news". Never choose "article" for these requests');
    expect(prompt).toContain('"announcements"');
    expect(prompt).toContain('"status"');
    expect(prompt).toContain('It is brief by design');
    expect(prompt).toContain('in-depth coverage belongs to "article"');
  });

  it('includes grouped tools from the enabled list', () => {
    const prompt = buildIntentSelectionPrompt(['serperWebSearch', 'serperImageSearch']);

    expect(prompt).toContain('serperWebSearch:');
    expect(prompt).toContain('serperImageSearch:');
  });

  it('lists multimodal and follow-up rules', () => {
    const prompt = buildIntentSelectionPrompt([]);

    expect(prompt).toContain('MULTIMODAL RULES');
    expect(prompt).toContain('FOLLOW-UP / REFINEMENT RULES');
    expect(prompt).toContain('needsClarification=true');
    expect(prompt).toContain('MUST be in the language identified by the "language" field');
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
    expect(prompt).toContain('the response will fail to render the requested media');
  });

  it('includes news vs article selection examples', () => {
    const prompt = buildIntentSelectionPrompt([]);

    expect(prompt).toContain('TEMPLATE SELECTION EXAMPLES');
    expect(prompt).toContain('"What is the latest news on Gaza?"');
    expect(prompt).toContain('template: "news"');
    expect(prompt).toContain('"Write an in-depth report on the Gaza conflict."');
    expect(prompt).toContain('template: "article"');
  });
});
