import { describe, expect, it } from 'vitest';

import { computeViewCenter } from './compute-view-center.helper';

describe('computeViewCenter', () => {
  it('shifts the view center by the pan (zoom-scaled)', () => {
    const { viewCx, viewCy } = computeViewCenter(10, 20, 2, -1, -1, 100, 50);

    expect(viewCx).toBe(80);
    expect(viewCy).toBe(10);
  });

  it('focuses on the cursor when the pointer is on the canvas', () => {
    const { focusX, focusY } = computeViewCenter(0, 0, 1, 30, 40, 100, 50);

    expect(focusX).toBe(30);
    expect(focusY).toBe(40);
  });

  it('focuses on the view center when the pointer left the canvas', () => {
    const { focusX, focusY } = computeViewCenter(0, 0, 1, -1, -1, 100, 50);

    expect(focusX).toBe(100);
    expect(focusY).toBe(50);
  });
});
