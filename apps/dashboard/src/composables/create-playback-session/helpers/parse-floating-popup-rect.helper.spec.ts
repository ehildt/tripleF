import { describe, expect, it } from 'vitest';

import { parseFloatingPopupRect } from './parse-floating-popup-rect.helper';

describe('parseFloatingPopupRect', () => {
  it('accepts finite safe coordinates and positive fractional dimensions', () => {
    expect(
      parseFloatingPopupRect(
        '{"x":-10.5,"y":20.25,"width":640.5,"height":360.25}',
      ),
    ).toEqual({ x: -10.5, y: 20.25, width: 640.5, height: 360.25 });
  });

  it('rejects missing, corrupt, or non-record values', () => {
    expect(parseFloatingPopupRect(null)).toBeNull();
    expect(parseFloatingPopupRect('')).toBeNull();
    expect(parseFloatingPopupRect('{')).toBeNull();
    expect(parseFloatingPopupRect('null')).toBeNull();
    expect(parseFloatingPopupRect('[]')).toBeNull();
  });

  it('rejects non-numeric, non-finite, unsafe, or non-positive geometry', () => {
    expect(
      parseFloatingPopupRect('{"x":"0","y":0,"width":100,"height":100}'),
    ).toBeNull();
    expect(
      parseFloatingPopupRect('{"x":0,"y":0,"width":1e400,"height":100}'),
    ).toBeNull();
    expect(
      parseFloatingPopupRect(
        '{"x":0,"y":0,"width":9007199254740992,"height":100}',
      ),
    ).toBeNull();
    expect(
      parseFloatingPopupRect('{"x":0,"y":0,"width":0,"height":100}'),
    ).toBeNull();
    expect(
      parseFloatingPopupRect('{"x":0,"y":0,"width":100,"height":-1}'),
    ).toBeNull();
  });
});
