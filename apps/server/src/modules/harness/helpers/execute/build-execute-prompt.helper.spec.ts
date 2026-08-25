import type { IntentResult } from '@triplef/agent/schemas';
import { describe, expect, it } from 'vitest';

import {
  buildImageExecutePrompt,
  buildToolExecutePrompt,
} from './build-execute-prompt.helper.js';

const buildIntent = (overrides: Partial<IntentResult> = {}): IntentResult =>
  ({
    template: 'article',
    prompt: 'default',
    tools: ['webSearch'],
    getDate: true,
    imageCount: 0,
    videoCount: 0,
    reasoning: '',
    contextSummary: '',
    needsClarification: false,
    plan: {},
    ...overrides,
  }) as IntentResult;

describe('buildToolExecutePrompt', () => {
  it('states the standalone query rules for every search query', () => {
    const prompt = buildToolExecutePrompt(buildIntent());

    expect(prompt).toContain('STANDALONE QUERY RULES');
    expect(prompt).toContain('Every query MUST be fully self-contained');
    expect(prompt).toContain(
      'NEVER copy the latest user message into a query verbatim',
    );
    expect(prompt).toContain(
      'take that subject from the CONTEXT SUMMARY or earlier conversation turns and fold it into every query',
    );
  });

  it('shows the verbatim follow-up failure example with its subject-explicit rewrite', () => {
    const prompt = buildToolExecutePrompt(buildIntent());

    expect(prompt).toContain('Neverness to Everness NTE reviews verdict');
    expect(prompt).toContain('never "what do the reviews say?"');
  });

  it('declares subject-less queries a failure above the endpoint guidance', () => {
    const prompt = buildToolExecutePrompt(buildIntent());

    expect(prompt).toContain(
      'A query without its explicit subject is a failure',
    );
    expect(prompt.indexOf('STANDALONE QUERY RULES')).toBeLessThan(
      prompt.indexOf('QUERY CRAFTING'),
    );
  });

  it('repeats the contract in the final reminder', () => {
    const prompt = buildToolExecutePrompt(buildIntent());

    expect(prompt).toContain(
      'Every query names its subject explicitly; never pass the user message verbatim as a query',
    );
  });

  it('pairs the standalone rules with product endpoint guidance for product tasks', () => {
    const prompt = buildToolExecutePrompt(buildIntent({ template: 'product' }));

    expect(prompt).toContain('STANDALONE QUERY RULES');
    expect(prompt).toContain('QUERY CRAFTING (product task)');
  });

  it('lists the mandatory tools from the intent', () => {
    const prompt = buildToolExecutePrompt(
      buildIntent({ tools: ['serperWebSearch', 'serperNewsSearch'] }),
    );

    expect(prompt).toContain(
      'MANDATORY tools you MUST call: serperWebSearch, serperNewsSearch',
    );
  });

  it('guides freshness decisions: evergreen queries get no year, time-sensitive ones may', () => {
    const prompt = buildToolExecutePrompt(buildIntent());

    expect(prompt).toContain('FRESHNESS (applies to every search query');
    expect(prompt).toContain("prefer the tool's recency parameter");
    expect(prompt).toContain(
      'do NOT add a year qualifier — it filters out good results',
    );
    expect(prompt).toContain(
      'vary the parallel queries: some fresh/dated, some with no year',
    );
  });

  it('no longer instructs a blanket current-year append', () => {
    const prompt = buildToolExecutePrompt(buildIntent());

    expect(prompt).not.toMatch(/Use this for time-sensitive queries/);
  });
});

describe('buildImageExecutePrompt', () => {
  it('teaches per-endpoint query crafting from visible signals', () => {
    const prompt = buildImageExecutePrompt([], 'en');

    expect(prompt).toContain('QUERY CRAFTING (image task)');
    expect(prompt).toContain(
      '*WebSearch: short factual identification queries',
    );
    expect(prompt).toContain(
      '*ImageSearch: a short standalone visual description of the subject',
    );
    expect(prompt).toContain("never with the user's verbatim message");
    expect(prompt).toContain('Filenames are hints, never verbatim queries');
  });

  it('requires every selected tool as parallel calls in one response', () => {
    const prompt = buildImageExecutePrompt([], 'en');

    expect(prompt).toContain(
      'Emit EVERY selected tool call in ONE response as parallel tool calls',
    );
  });

  it('lists the available variants and language instruction', () => {
    const prompt = buildImageExecutePrompt(['grayscale'], 'de');

    expect(prompt).toContain('grayscale');
    expect(prompt).toContain('Detected user language: de');
  });
});
