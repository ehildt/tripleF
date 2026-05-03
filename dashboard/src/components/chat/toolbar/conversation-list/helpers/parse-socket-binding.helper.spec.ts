import { describe, expect, it } from 'vitest';

import { parseSocketBinding } from './parse-socket-binding.helper';

describe('parseSocketBinding', () => {
  it('parses event only', () => {
    expect(parseSocketBinding('harness')).toEqual({
      event: 'harness',
      roomId: '',
    });
  });

  it('parses event with roomId', () => {
    expect(parseSocketBinding('harness::room1')).toEqual({
      event: 'harness',
      roomId: 'room1',
    });
  });

  it('parses event with empty roomId after separator', () => {
    expect(parseSocketBinding('harness::')).toEqual({
      event: 'harness',
      roomId: '',
    });
  });

  it('returns empty strings for empty input', () => {
    expect(parseSocketBinding('')).toEqual({ event: '', roomId: '' });
  });
});
