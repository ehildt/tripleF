import { describe, expect, it } from 'vitest';

import { defaultSummarize, summarizeContent, summarizeFound, summarizeResults, withSummary } from './tool-factory.js';

describe('tool-factory', () => {
  describe('summarizeResults', () => {
    it('returns result count and unique sources', () => {
      const result = summarizeResults({
        results: [{ source: 'serperB' }, { source: 'serperB' }, { source: 'serper' }, {}],
      });
      expect(result).toEqual({
        resultCount: 4,
        sources: ['serperB', 'serper'],
        sampleImageUrls: [],
      });
    });

    it('returns empty object when results is missing', () => {
      expect(summarizeResults({})).toEqual({});
    });

    it('returns empty sources when no results carry a source', () => {
      const result = summarizeResults({ results: [{}, {}] });
      expect(result).toEqual({
        resultCount: 2,
        sources: [],
        sampleImageUrls: [],
      });
    });

    it('collects sample image URLs from results', () => {
      const result = summarizeResults({
        results: [
          { source: 'serper', imageUrl: 'https://example.com/a.jpg' },
          { source: 'serper', imageUrl: 'https://example.com/b.jpg' },
          { source: 'serperB' },
        ],
      });
      expect(result.sampleImageUrls).toEqual(['https://example.com/a.jpg', 'https://example.com/b.jpg']);
    });
  });

  describe('summarizeContent', () => {
    it('returns the content length', () => {
      expect(summarizeContent({ content: 'hello world' })).toEqual({
        contentLength: 11,
      });
    });

    it('defaults to zero for non-string content', () => {
      expect(summarizeContent({ content: 123 })).toEqual({ contentLength: 0 });
      expect(summarizeContent({})).toEqual({ contentLength: 0 });
    });
  });

  describe('summarizeFound', () => {
    it('returns true when a title is present', () => {
      expect(summarizeFound({ title: 'Page' })).toEqual({ found: true });
    });

    it('returns true when an id is present', () => {
      expect(summarizeFound({ id: 42 })).toEqual({ found: true });
    });

    it('returns false when neither title nor id is present', () => {
      expect(summarizeFound({ text: 'content' })).toEqual({ found: false });
    });
  });

  describe('defaultSummarize', () => {
    it('prefers results-array summarization', () => {
      const result = defaultSummarize({
        results: [{ source: 'serperC' }],
        content: 'irrelevant',
      });
      expect(result).toEqual({
        resultCount: 1,
        sources: ['serperC'],
        sampleImageUrls: [],
      });
    });

    it('falls back to content summarization', () => {
      expect(defaultSummarize({ content: 'abc' })).toEqual({
        contentLength: 3,
      });
    });

    it('returns empty object for unrecognized shapes', () => {
      expect(defaultSummarize({ foo: 'bar' })).toEqual({});
    });
  });

  describe('withSummary', () => {
    it('attaches a custom summarizer to a tool', () => {
      const mockTool = {
        description: 'test',
        parameters: {},
        execute: async () => ({ value: 1 }),
      } as any;
      const custom = (data: Record<string, unknown>) => ({
        custom: data.value,
      });
      const wrapped = withSummary(mockTool, custom);
      expect(wrapped.summarize?.({ value: 5 })).toEqual({ custom: 5 });
    });

    it('uses the default summarizer when none is provided', () => {
      const mockTool = {
        description: 'test',
        parameters: {},
        execute: async () => ({ content: 'hi' }),
      } as any;
      const wrapped = withSummary(mockTool);
      expect(wrapped.summarize?.({ content: 'hello' })).toEqual({
        contentLength: 5,
      });
    });
  });
});
