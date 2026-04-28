import { Readable } from 'node:stream';

import { MultipartFile } from '@fastify/multipart';
import { BadRequestException } from '@nestjs/common';

import { MultipartFilesPipe } from './multipart-files.pipe.js';

const mockFile = (filename: string, mimetype: string): MultipartFile => ({
  type: 'file',
  fieldname: 'test',
  filename,
  encoding: '7bit',
  mimetype,
  fields: {},
  toBuffer: async () => Buffer.from('test'),
  file: Object.assign(new Readable({ read() {} }), {
    truncated: false,
    bytesRead: 0,
  }),
});

describe('MultipartFilesPipe', () => {
  it('returns only file parts', () => {
    const pipe = new MultipartFilesPipe({ fieldName: 'files' });
    const value = [
      mockFile('a.txt', 'text/plain'),
      { type: 'field', fieldname: 'files', value: 'ignore me' },
    ] as any;

    const result = pipe.transform(value);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('a.txt');
  });

  it('throws when required and no files', () => {
    const pipe = new MultipartFilesPipe({ fieldName: 'files', required: true });
    expect(() => pipe.transform([])).toThrow(BadRequestException);
  });

  it('allows optional field with no files', () => {
    const pipe = new MultipartFilesPipe({
      fieldName: 'files',
      required: false,
    });
    expect(pipe.transform([])).toEqual([]);
  });

  it('respects minFiles', () => {
    const pipe = new MultipartFilesPipe({ fieldName: 'files', minFiles: 2 });
    const value = [mockFile('a.txt', 'text/plain')];

    expect(() => pipe.transform(value)).toThrow(
      /Expected at least 2 file\(s\)/,
    );
  });

  it('respects maxFiles', () => {
    const pipe = new MultipartFilesPipe({ fieldName: 'files', maxFiles: 1 });
    const value = [
      mockFile('a.txt', 'text/plain'),
      mockFile('b.txt', 'text/plain'),
    ];

    expect(() => pipe.transform(value)).toThrow(/Expected at most 1 file\(s\)/);
  });

  it('respects allowedMimeTypes', () => {
    const pipe = new MultipartFilesPipe({
      fieldName: 'files',
      allowedMimeTypes: ['image/png'],
    });

    const value = [mockFile('a.txt', 'text/plain')];
    expect(() => pipe.transform(value)).toThrow(/Invalid file type/);

    const valid = [mockFile('b.png', 'image/png')];
    expect(pipe.transform(valid)).toHaveLength(1);
  });

  it('normalizes single value to array', () => {
    const pipe = new MultipartFilesPipe({ fieldName: 'files' });
    const file = mockFile('single.txt', 'text/plain');

    const result = pipe.transform(file as any);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('single.txt');
  });
});
