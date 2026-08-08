import { describe, expect, it } from 'vitest';

import type { IntentResult } from '../../templates/intent.schema.js';

import {
  buildFallbackInput,
  buildImageExecutePrompt,
  buildToolExecutePrompt,
  enrichSearchInput,
  isNoFallbackTool,
  isPureSearchTool,
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

describe('isNoFallbackTool', () => {
  it('marks URL/title-based tools as unsuitable for fallback invocation', () => {
    expect(isNoFallbackTool('webFetch')).toBe(true);
    expect(isNoFallbackTool('serperWebpageScrape')).toBe(true);
  });

  it('allows search tools for fallback invocation', () => {
    expect(isNoFallbackTool('webSearch')).toBe(false);
    expect(isNoFallbackTool('serperImageSearch')).toBe(false);
  });
});

describe('isPureSearchTool', () => {
  it('recognizes keyword-based search tools', () => {
    expect(isPureSearchTool('serperWebSearch')).toBe(true);
    expect(isPureSearchTool('brightDataWebSearch')).toBe(true);
    expect(isPureSearchTool('serperShoppingSearch')).toBe(true);
    expect(isPureSearchTool('serperBusinessReviewsSearch')).toBe(true);
    expect(isPureSearchTool('serperPlacesSearch')).toBe(true);
  });

  it('rejects non-search tools', () => {
    expect(isPureSearchTool('webFetch')).toBe(false);
    expect(isPureSearchTool('serperImageSearch')).toBe(false);
  });
});

describe('enrichSearchInput', () => {
  it('adds count and language when provided', () => {
    const base: Record<string, unknown> = { query: 'q' };
    enrichSearchInput(base, 5, 'de');
    expect(base).toEqual({ query: 'q', count: 5, lang: 'de' });
  });

  it('skips invalid counts and missing language', () => {
    const base: Record<string, unknown> = { query: 'q' };
    enrichSearchInput(base, 0);
    expect(base).toEqual({ query: 'q' });
  });
});

describe('buildFallbackInput', () => {
  it('returns undefined for non-fallback tools', () => {
    expect(buildFallbackInput('webFetch', 'q')).toBeUndefined();
    expect(buildFallbackInput('serperWebpageScrape', 'q')).toBeUndefined();
  });

  it('builds image search input with count and no language', () => {
    // Images are language-agnostic: the fallback never injects a locale.
    expect(buildFallbackInput('serperImageSearch', 'q', 7, 3, 'en')).toEqual({
      query: 'q',
      count: 7,
    });
    expect(buildFallbackInput('serperImageSearch', 'q', 0, 3, 'en')).toEqual({
      query: 'q',
    });
  });

  it('builds video and news search input with count and language', () => {
    expect(buildFallbackInput('serperVideoSearch', 'q', 7, 4, 'de')).toEqual({
      query: 'q',
      count: 4,
      lang: 'de',
    });
    expect(buildFallbackInput('serperNewsSearch', 'q', 7, 4)).toEqual({
      query: 'q',
      count: 4,
    });
  });

  it('builds pure search input with language only', () => {
    expect(buildFallbackInput('serperWebSearch', 'q', 7, 4, 'ja')).toEqual({
      query: 'q',
      lang: 'ja',
    });
  });
});

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
  it('requires standalone search queries that combine the visible signal with the established subject', () => {
    const prompt = buildImageExecutePrompt([], 'en');

    expect(prompt).toContain('Every search query must be standalone');
    expect(prompt).toContain(
      'combining the visible signal with the established subject from the conversation or CONTEXT SUMMARY',
    );
    expect(prompt).toContain(
      'Never emit a bare generic description or the user message verbatim',
    );
  });

  it('lists the available variants and language instruction', () => {
    const prompt = buildImageExecutePrompt(['grayscale'], 'de');

    expect(prompt).toContain('grayscale');
    expect(prompt).toContain('Detected user language: de');
  });
});
