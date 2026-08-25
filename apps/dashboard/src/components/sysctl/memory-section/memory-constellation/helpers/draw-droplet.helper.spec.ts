import { describe, expect, it } from 'vitest';

import { drawDroplet } from './draw-droplet.helper';

const gradient = { addColorStop: vi.fn() };
const makeCtx = () =>
  ({
    createRadialGradient: vi.fn(() => gradient),
    fillStyle: '',
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  }) as unknown as CanvasRenderingContext2D;

describe('drawDroplet', () => {
  it('paints a glow circle plus a solid core at the point', () => {
    const ctx = makeCtx();
    drawDroplet(ctx, 5, 6, 0.5);

    expect(ctx.createRadialGradient).toHaveBeenCalledWith(5, 6, 0, 5, 6, 0.8);
    expect(ctx.arc).toHaveBeenCalledTimes(2);
    expect(ctx.fill).toHaveBeenCalledTimes(2);
  });

  it('uses the supplied main-dot color for the glow and core', () => {
    const ctx = makeCtx();
    drawDroplet(ctx, 5, 6, 0.5, '#8b5cf6');

    expect(gradient.addColorStop).toHaveBeenCalledWith(
      0,
      'rgba(139, 92, 246, 0.5)',
    );
    expect(gradient.addColorStop).toHaveBeenCalledWith(
      1,
      'rgba(139, 92, 246, 0)',
    );
  });
});
