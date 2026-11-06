import { isObjectNotFoundError } from './is-object-not-found-error.helper.js';

describe('isObjectNotFoundError', () => {
  it.each(['NoSuchKey', 'NotFound'])('recognizes %s errors', (name) => {
    expect(isObjectNotFoundError({ name })).toBe(true);
  });

  it('recognizes an AWS SDK HTTP 404 response', () => {
    expect(
      isObjectNotFoundError({
        name: 'S3ServiceException',
        $metadata: { httpStatusCode: 404 },
      }),
    ).toBe(true);
  });

  it('rejects other errors and non-object values', () => {
    expect(isObjectNotFoundError(new Error('network failure'))).toBe(false);
    expect(isObjectNotFoundError(null)).toBe(false);
    expect(isObjectNotFoundError('NotFound')).toBe(false);
  });
});
