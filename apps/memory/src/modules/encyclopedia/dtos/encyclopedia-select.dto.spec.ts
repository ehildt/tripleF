import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import {
  EncyclopediaSearchResultDto,
  EncyclopediaSelectDto,
} from './encyclopedia-select.dto.js';

describe('EncyclopediaSearchResultDto', () => {
  it('accepts a valid search result', async () => {
    const dto = plainToInstance(EncyclopediaSearchResultDto, {
      url: 'https://example.com/article',
      title: 'Article title',
      snippet: 'The result snippet…',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a search result missing its url', async () => {
    const dto = plainToInstance(EncyclopediaSearchResultDto, {
      snippet: 'The result snippet…',
    });

    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejects a search result missing its snippet', async () => {
    const dto = plainToInstance(EncyclopediaSearchResultDto, {
      url: 'https://example.com/article',
    });

    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});

describe('EncyclopediaSelectDto', () => {
  it('accepts the turn model (threaded to the classify auto-trigger)', async () => {
    const dto = plainToInstance(EncyclopediaSelectDto, {
      query: 'What is the capital of France?',
      documents: [
        { url: 'https://example.com/article', content: 'The article body…' },
      ],
      model: 'qwen3:8b',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('accepts a select body without a model (optional)', async () => {
    const dto = plainToInstance(EncyclopediaSelectDto, {
      query: 'What is the capital of France?',
      documents: [
        { url: 'https://example.com/article', content: 'The article body…' },
      ],
    });

    expect(await validate(dto)).toHaveLength(0);
  });
});
