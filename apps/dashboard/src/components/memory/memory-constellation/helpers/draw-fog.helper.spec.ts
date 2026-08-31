import { describe, expect, it } from 'vitest';

import { drawFog } from './draw-fog.helper';

/** Minimal recording stub for the 2D context calls drawFog makes. */
const makeCtx = () => {
  const gradient = { addColorStop: vi.fn() };
  return {
    createRadialGradient: vi.fn(() => gradient),
    fillStyle: '',
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D & {
    createRadialGradient: ReturnType<typeof vi.fn>;
  };
};

describe('drawFog', () => {
  it('paints a radial gradient circle at the projected center', () => {
    const ctx = makeCtx();
    drawFog(ctx, { x: 10, y: 20, scale: 1 }, 50, '#ff0000', 1);

    expect(ctx.createRadialGradient).toHaveBeenCalledWith(
      10,
      20,
      0,
      10,
      20,
      50,
    );
    expect(ctx.arc).toHaveBeenCalledWith(10, 20, 50, 0, Math.PI * 2);
    expect(ctx.fill).toHaveBeenCalled();
  });

  it('fades the core alpha with the topic opacity', () => {
    const ctx = makeCtx();
    drawFog(ctx, { x: 0, y: 0, scale: 1 }, 50, '#ff0000', 0.5);

    const gradient = ctx.createRadialGradient.mock.results[0]!.value as {
      addColorStop: ReturnType<typeof vi.fn>;
    };
    expect(gradient.addColorStop.mock.calls[0]![1]).toBe(
      'rgba(255, 0, 0, 0.07)',
    );
  });
});
