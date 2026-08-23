import { SerializedBuffer } from '@triplef/helpers/is-buffer-or-serialized';

import { toBuffer } from './image-buffer.helper.js';

describe('toBuffer', () => {
  it('returns a Buffer unchanged', () => {
    const buffer = Buffer.from([1, 2, 3]);

    expect(toBuffer(buffer)).toBe(buffer);
  });

  it('converts a serialized Buffer back to a real Buffer', () => {
    const data = [1, 2, 3, 4, 5];
    const serialized: SerializedBuffer = { type: 'Buffer', data };

    const result = toBuffer(serialized);

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result).toEqual(Buffer.from(data));
  });

  it('throws when the input is neither a Buffer nor a serialized Buffer', () => {
    expect(() => toBuffer('not-a-buffer' as unknown as Buffer)).toThrow(
      'Invalid buffer format',
    );
  });
});
