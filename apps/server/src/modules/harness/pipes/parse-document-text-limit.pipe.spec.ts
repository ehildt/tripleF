import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { ParseDocumentTextLimitPipe } from './parse-document-text-limit.pipe.js';

const pipe = new ParseDocumentTextLimitPipe();
const metadata = { data: 'documentTextLimit', type: 'body' } as any;

const field = (value: string) => ({
  type: 'field',
  fieldname: 'documentTextLimit',
  value,
});

describe('ParseDocumentTextLimitPipe', () => {
  it('parses a non-negative integer', () => {
    expect(pipe.transform([field('2048')], metadata)).toBe(2048);
  });

  it('parses zero as "uncapped"', () => {
    expect(pipe.transform([field('0')], metadata)).toBe(0);
  });

  it('accepts a single multipart field object', () => {
    expect(pipe.transform(field('10'), metadata)).toBe(10);
  });

  it('returns undefined when the field is absent or empty', () => {
    expect(pipe.transform([], metadata)).toBeUndefined();
    expect(pipe.transform([field('')], metadata)).toBeUndefined();
  });

  it('ignores parts that are not the target field', () => {
    const other = { type: 'field', fieldname: 'file', value: '10' };

    expect(pipe.transform([other], metadata)).toBeUndefined();
  });

  it('rejects a negative value', () => {
    expect(() => pipe.transform([field('-1')], metadata)).toThrow(
      'documentTextLimit must be a non-negative integer',
    );
  });

  it('rejects a fractional value', () => {
    expect(() => pipe.transform([field('1.5')], metadata)).toThrow(
      BadRequestException,
    );
  });

  it('rejects a non-numeric value', () => {
    expect(() => pipe.transform([field('lots')], metadata)).toThrow(
      BadRequestException,
    );
  });
});
