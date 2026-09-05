import { describe, expect, it } from 'vitest';

import { drawNodeLabel } from './draw-node-label.helper';

describe('drawNodeLabel', () => {
  it('writes the label to the right of the dot with the topic color', () => {
    const ctx = {
      fillStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
      globalAlpha: 1,
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    drawNodeLabel(ctx, 10, 20, 'work (11)', '#8b5cf6', 0.5);

    expect(ctx.fillStyle).toBe('#8b5cf6');
    expect(ctx.fillText).toHaveBeenCalledWith('work (11)', 18, 20);
    expect(ctx.globalAlpha).toBe(1);
  });

  it('honors a custom offset for dots with rings', () => {
    const ctx = {
      fillStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
      globalAlpha: 1,
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    drawNodeLabel(ctx, 10, 20, 'work', '#8b5cf6', 0.5, 20);

    expect(ctx.fillText).toHaveBeenCalledWith('work', 30, 20);
  });
});
