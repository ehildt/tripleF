import { describe, expect, it } from 'vitest';

import { clampWindow } from './clamp-window.helper';

describe('clampWindow', () => {
  it('keeps an in-bounds window unchanged', () => {
    expect(clampWindow({ from: 10, to: 50 }, 100)).toEqual({
      from: 10,
      to: 50,
    });
  });

  it('pushes a window past the start back into bounds', () => {
    expect(clampWindow({ from: -5, to: 45 }, 100)).toEqual({ from: 0, to: 50 });
  });

  it('pulls a window past the end back into bounds', () => {
    expect(clampWindow({ from: 80, to: 120 }, 100)).toEqual({
      from: 60,
      to: 100,
    });
  });

  it('shrinks a window wider than the data', () => {
    expect(clampWindow({ from: -10, to: 200 }, 100)).toEqual({
      from: 0,
      to: 100,
    });
  });

  it('handles an empty series', () => {
    expect(clampWindow({ from: 0, to: 5 }, 0)).toEqual({ from: 0, to: 0 });
  });
});
