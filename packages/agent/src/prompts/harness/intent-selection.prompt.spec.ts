import { describe, expect, it } from 'vitest';

import { buildIntentSelectionPrompt } from './intent-selection.prompt.js';

describe('buildIntentSelectionPrompt', () => {
  it('instructs the growth loop: probe, gather, capture preferences, honor explicit asks', () => {
    const prompt = buildIntentSelectionPrompt(['memory-partition-recall', 'memory-partition-remember']);

    expect(prompt).toContain('MEMORY RULES');
    expect(prompt).toContain('active growth loop');
    // The probe is unconditional: the classifier can't know whether user
    // memory exists without checking, so memory-partition-recall is included
    // in EVERY request when memory tools are enabled — never gated on topic.
    expect(prompt).toContain('ALWAYS-PROBE');
    expect(prompt).toContain('include the enabled memory-partition-recall tool in EVERY request');
    // The model gathers more general knowledge about subjects AND stores the
    // findings — GATHER-TO-REMEMBER must include memory-partition-remember,
    // not just the web searches, or the gathered facts are never persisted.
    expect(prompt).toContain('GATHER-TO-REMEMBER');
    expect(prompt).toContain(
      'include BOTH the enabled *WebSearch tools AND the enabled memory-partition-remember tool',
    );
    expect(prompt).toContain('the memory-partition-remember call stores the notable facts that were found');
    // Stated preferences are recorded even without an explicit "remember".
    expect(prompt).toContain('PREFERENCE CAPTURE');
    expect(prompt).toContain('even when the user did not say "remember"');
    // Derived understanding goes to the cognition lane, never the partition.
    expect(prompt).toContain('DERIVED UNDERSTANDING');
    expect(prompt).toContain('memory-cognition-remember');
    // Explicit remember/track/learn/ follow asks are honored in any language.
    expect(prompt).toContain('EXPLICIT INSTRUCTION');
    expect(prompt).toContain('remember, track, follow, or learn something');
    // The probe is never replaced by web search.
    expect(prompt).toContain('never replace memory-partition-recall with web search');
    expect(prompt).toContain('CONTINUATION');
    expect(prompt).toContain('UPDATE-LOOP');
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
