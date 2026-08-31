import { describe, expect, it } from 'vitest';

import { drawTopicFog } from './draw-topic-fog.helper';

/** Minimal recording stub for the 2D context; returns the gradient mock too. */
const makeCtx = () => {
  const gradient = { addColorStop: vi.fn() };
  const ctx = {
    createRadialGradient: vi.fn(() => gradient),
    fillStyle: '',
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  return { ctx, gradient };
};

describe('drawTopicFog', () => {
  it('draws one fog circle per topic at its projected center', () => {
    const { ctx } = makeCtx();
    drawTopicFog(
      ctx,
      [
        {
          key: 'x',
          center: { x: 0, y: 0, z: 0 },
          radius: 100,
          color: '#ff0000',
        },
      ],
      0,
      0,
      500,
      50,
      25,
      1,
      new Map([['x', 0.5]]),
    );

    expect(ctx.createRadialGradient).toHaveBeenCalledTimes(1);
    expect(ctx.fill).toHaveBeenCalledTimes(1);
  });

  it('scales the core alpha with the topic opacity', () => {
    const { ctx, gradient } = makeCtx();
    drawTopicFog(
      ctx,
      [
        {
          key: 'x',
          center: { x: 0, y: 0, z: 0 },
          radius: 100,
          color: '#00ff00',
        },
      ],
      0,
      0,
      500,
      0,
      0,
      1,
      new Map([['x', 0.5]]),
    );

    // Half-strength core: 0.14 × 0.5 alpha in the gradient's first stop.
    expect(gradient.addColorStop.mock.calls[0]![1]).toBe(
      'rgba(0, 255, 0, 0.07)',
    );
  });

  it('draws an untracked topic at full strength', () => {
    const { ctx, gradient } = makeCtx();
    drawTopicFog(
      ctx,
      [
        {
          key: 'y',
          center: { x: 0, y: 0, z: 0 },
          radius: 100,
          color: '#00ff00',
        },
      ],
      0,
      0,
      500,
      0,
      0,
      1,
      new Map(),
    );

    expect(gradient.addColorStop.mock.calls[0]![1]).toBe(
      'rgba(0, 255, 0, 0.14)',
    );
  });
});
