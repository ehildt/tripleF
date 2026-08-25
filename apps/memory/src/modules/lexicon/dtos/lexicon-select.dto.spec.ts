import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { LexiconSearchResultDto } from './lexicon-select.dto.js';

describe('LexiconSearchResultDto', () => {
  it('accepts a valid search result', async () => {
    const dto = plainToInstance(LexiconSearchResultDto, {
      url: 'https://example.com/article',
      title: 'Article title',
      snippet: 'The result snippet…',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a search result missing its url', async () => {
    const dto = plainToInstance(LexiconSearchResultDto, {
      snippet: 'The result snippet…',
    });

    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejects a search result missing its snippet', async () => {
    const dto = plainToInstance(LexiconSearchResultDto, {
      url: 'https://example.com/article',
    });

    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});
