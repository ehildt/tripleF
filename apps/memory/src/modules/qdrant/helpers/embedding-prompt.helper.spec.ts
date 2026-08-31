import { describe, expect, it } from 'vitest';

import {
  applyEmbeddingRole,
  EMBEDDING_PROMPT_FORMATS,
  resolveEmbeddingPromptFormat,
} from './embedding-prompt.helper.js';

describe('resolveEmbeddingPromptFormat', () => {
  it('resolves embeddinggemma from the plain Ollama tag', () => {
    expect(resolveEmbeddingPromptFormat('embeddinggemma')?.family).toBe(
      'embeddinggemma',
    );
  });

  it('resolves the nomic family from plain, MoE and cluster tags', () => {
    expect(resolveEmbeddingPromptFormat('nomic-embed-text')?.family).toBe(
      'nomic',
    );
    expect(
      resolveEmbeddingPromptFormat('nomic-embed-text-v2-moe')?.family,
    ).toBe('nomic');
    expect(
      resolveEmbeddingPromptFormat('toshk0/nomic-embed-text-v2-moe:Q6_K')
        ?.family,
    ).toBe('nomic');
  });

  it('matches family names case-insensitively', () => {
    expect(resolveEmbeddingPromptFormat('Nomic-Embed-Text')?.family).toBe(
      'nomic',
    );
  });

  it('returns null for unknown models', () => {
    expect(resolveEmbeddingPromptFormat('all-minilm')).toBeNull();
    expect(resolveEmbeddingPromptFormat('mxbai-embed-large')).toBeNull();
    expect(resolveEmbeddingPromptFormat('qwen3-embedding:0.6b')).toBeNull();
  });
});

describe('applyEmbeddingRole', () => {
  it('prepends the embeddinggemma query prompt for queries', () => {
    expect(
      applyEmbeddingRole(
        'embeddinggemma',
        'query',
        'What did I ask about vectors?',
      ),
    ).toBe('task: search result | query: What did I ask about vectors?');
  });

  it('prepends the embeddinggemma document prompt for documents', () => {
    expect(
      applyEmbeddingRole('embeddinggemma', 'document', 'I like vector search'),
    ).toBe('title: none | text: I like vector search');
  });

  it('prepends the nomic query prompt for queries', () => {
    expect(
      applyEmbeddingRole(
        'nomic-embed-text-v2-moe',
        'query',
        'prefer single-line if statements',
      ),
    ).toBe('search_query: prefer single-line if statements');
  });

  it('prepends the nomic document prompt for documents', () => {
    expect(
      applyEmbeddingRole('nomic-embed-text', 'document', 'use single-line ifs'),
    ).toBe('search_document: use single-line ifs');
  });

  it('leaves unknown models unchanged', () => {
    expect(applyEmbeddingRole('all-minilm', 'query', 'some text')).toBe(
      'some text',
    );
    expect(applyEmbeddingRole('all-minilm', 'document', 'some text')).toBe(
      'some text',
    );
  });

  it('applies the prefix to empty text as well', () => {
    expect(applyEmbeddingRole('nomic', 'query', '')).toBe('search_query: ');
  });
});

describe('EMBEDDING_PROMPT_FORMATS', () => {
  it('declares query and document prefixes for every family', () => {
    for (const format of EMBEDDING_PROMPT_FORMATS) {
      expect(format.family.length).toBeGreaterThan(0);
      expect(format.queryPrefix.length).toBeGreaterThan(0);
      expect(format.documentPrefix.length).toBeGreaterThan(0);
      expect(format.queryPrefix).not.toBe(format.documentPrefix);
    }
  });
});
