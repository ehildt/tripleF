import { BadRequestException } from '@nestjs/common';

import { MultipartFieldPipe } from './multipart-field.pipe.js';

describe('MultipartFieldPipe', () => {
  let pipe: MultipartFieldPipe;

  beforeEach(() => {
    pipe = new MultipartFieldPipe();
  });

  describe('transform', () => {
    it('returns the value when it is defined', async () => {
      const value = { type: 'field', value: 'test-value' };

      const result = await pipe.transform(
        value as any,
        {
          type: 'body',
          data: 'testField',
        } as any,
      );

      expect(result).toEqual(value);
    });

    it('returns the value when it is an empty string', async () => {
      const value = { type: 'field', value: '' };

      const result = await pipe.transform(
        value as any,
        {
          type: 'body',
          data: 'testField',
        } as any,
      );

      expect(result).toEqual(value);
    });

    it('throws BadRequestException when value is null', () => {
      expect(() =>
        pipe.transform(null as any, { type: 'body', data: 'testField' } as any),
      ).toThrow(BadRequestException);
    });

    it('throws BadRequestException when value is undefined', () => {
      expect(() =>
        pipe.transform(
          undefined as any,
          { type: 'body', data: 'testField' } as any,
        ),
      ).toThrow(BadRequestException);
    });

    it('throws BadRequestException with field name in error message', () => {
      expect(() =>
        pipe.transform(null as any, { type: 'body', data: 'myField' } as any),
      ).toThrow('Invalid multipart field myField');
    });
  });
});
