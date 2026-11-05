import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { ParseHashesPipe } from './parse-hashes.pipe.js';

const pipe = new ParseHashesPipe();
const metadata = { data: 'hashes', type: 'body' } as any;

const field = (value: string) => ({
  type: 'field',
  fieldname: 'hashes',
  value,
});

describe('ParseHashesPipe', () => {
  it('parses a JSON string array', () => {
    expect(pipe.transform([field('["a","b"]')], metadata)).toEqual(['a', 'b']);
  });

  it('accepts a single multipart field object', () => {
    expect(pipe.transform(field('["only"]'), metadata)).toEqual(['only']);
  });

  it('returns undefined when the field is absent', () => {
    expect(pipe.transform([], metadata)).toBeUndefined();
  });

  it('returns undefined when the field is empty', () => {
    expect(pipe.transform([field('')], metadata)).toBeUndefined();
  });

  it('ignores parts that are not the target field', () => {
    const other = { type: 'field', fieldname: 'file', value: '["x"]' };

    expect(pipe.transform([other], metadata)).toBeUndefined();
  });

  it('ignores file parts even when the fieldname matches', () => {
    const filePart = { type: 'file', fieldname: 'hashes', value: '["x"]' };

    expect(pipe.transform([filePart], metadata)).toBeUndefined();
  });

  it('rejects malformed JSON', () => {
    expect(() => pipe.transform([field('not-json')], metadata)).toThrow(
      BadRequestException,
    );
  });

  it('rejects a JSON value that is not an array', () => {
    expect(() => pipe.transform([field('{"a":1}')], metadata)).toThrow(
      'hashes must be a JSON array of strings',
    );
  });

  it('rejects an array of non-strings', () => {
    expect(() => pipe.transform([field('[1,2]')], metadata)).toThrow(
      'hashes must be a JSON array of strings',
    );
  });

  it('accepts an empty array', () => {
    expect(pipe.transform([field('[]')], metadata)).toEqual([]);
  });
});
