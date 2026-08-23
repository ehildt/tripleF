import { ArgumentMetadata, BadRequestException } from '@nestjs/common';

import { Prompt } from '../dtos/prompt.dto.js';

import { ParsePromptPipe } from './parse-prompt.pipe.js';

describe('ParsePromptPipe', () => {
  let pipe: ParsePromptPipe;

  const metadata: ArgumentMetadata = {
    type: 'custom',
    metatype: undefined,
    data: 'prompt',
  };

  beforeEach(() => {
    pipe = new ParsePromptPipe();
  });

  it('returns empty array when value is undefined', async () => {
    await expect(pipe.transform(undefined, metadata)).resolves.toEqual([]);
  });

  it('returns empty array when matching field is missing', async () => {
    const value = [{ type: 'field', fieldname: 'other', value: '{}' }];

    await expect(pipe.transform(value, metadata)).resolves.toEqual([]);
  });

  it('returns empty array when JSON is invalid', async () => {
    const value = [{ type: 'field', fieldname: 'prompt', value: '{invalid' }];

    await expect(pipe.transform(value, metadata)).resolves.toEqual([]);
  });

  it('parses and validates a single prompt', async () => {
    const value = [
      {
        type: 'field',
        fieldname: 'prompt',
        value: '[{"role":"user","content":"hello"}]',
      },
    ];

    const result = await pipe.transform(value, metadata);

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Prompt);
    expect(result[0]).toMatchObject({
      role: 'user',
      content: 'hello',
    });
  });

  it('parses and validates multiple prompts', async () => {
    const value = [
      {
        type: 'field',
        fieldname: 'prompt',
        value:
          '[{"role":"user","content":"one"},{"role":"assistant","content":"two"}]',
      },
    ];

    const result = await pipe.transform(value, metadata);

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.content)).toEqual(['one', 'two']);
  });

  it('throws BadRequestException on validation errors', async () => {
    const value = [
      {
        type: 'field',
        fieldname: 'prompt',
        value: '[{"role":123,"content":false}]',
      },
    ];

    await expect(pipe.transform(value, metadata)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('accepts non-array value by normalizing to array', async () => {
    const value = {
      type: 'field',
      fieldname: 'prompt',
      value: '[{"role":"system","content":"single"}]',
    };

    const result = await pipe.transform(value, metadata);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      role: 'system',
      content: 'single',
    });
  });
});
