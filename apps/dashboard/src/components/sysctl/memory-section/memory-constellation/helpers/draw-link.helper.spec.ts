import { describe, expect, it } from 'vitest';

import type {
  PreparedLink,
  ProjectedPoint,
} from '../MemoryConstellation.types';
import { drawLink } from './draw-link.helper';

const gradient = { addColorStop: vi.fn() };
const makeCtx = () =>
  ({
    createRadialGradient: vi.fn(() => gradient),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    setLineDash: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  }) as unknown as CanvasRenderingContext2D;

const projected: ProjectedPoint[] = [
  { x: 0, y: 0, scale: 1 },
  { x: 100, y: 0, scale: 1 },
];

describe('drawLink', () => {
  it('draws a solid cluster-colored curve for intra edges', () => {
    const ctx = makeCtx();
    const link: PreparedLink = { a: 0, b: 1, kind: 'intra', alpha: 0.5 };
    drawLink(ctx, link, projected, 1, '#ff0000', 0, 0);

    expect(ctx.strokeStyle).toBe('#ff0000');
    expect(ctx.setLineDash).toHaveBeenCalledWith([]);
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
  });

  it('draws a gray dashed curve for inter edges', () => {
    const ctx = makeCtx();
    const link: PreparedLink = {
      a: 0,
      b: 1,
      kind: 'inter',
      alpha: 0.5,
      score: 0.8,
    };
    drawLink(ctx, link, projected, 1, '#ff0000', 0, 0);

    expect(ctx.strokeStyle).toBe('#6b7280');
    expect(ctx.setLineDash).toHaveBeenCalledWith([4, 4]);
  });

  it('spawns traveling light droplets on gray edges, not intra edges', () => {
    const ctx = makeCtx();
    drawLink(
      ctx,
      { a: 0, b: 1, kind: 'inter', alpha: 0.5, score: 0.8 },
      projected,
      1,
      '#000',
      0,
      0,
    );
    const interCalls = ctx.arc.mock.calls.length;
    drawLink(
      ctx,
      { a: 0, b: 1, kind: 'intra', alpha: 0.5 },
      projected,
      1,
      '#000',
      0,
      0,
    );
    const intraCalls = ctx.arc.mock.calls.length;

    // 3 droplets × (glow + core) circles on the inter edge, none on intra.
    expect(interCalls).toBe(6);
    expect(intraCalls).toBe(6);
  });

  it('draws sibling and community edges as solid gray lines', () => {
    const ctx = makeCtx();
    drawLink(
      ctx,
      { a: 0, b: 1, kind: 'sibling', alpha: 0.5, score: 0.8 },
      projected,
      1,
      '#ff0000',
      0,
      0,
    );
    expect(ctx.strokeStyle).toBe('#6b7280');
    expect(ctx.setLineDash).toHaveBeenCalledWith([]);

    drawLink(
      ctx,
      { a: 0, b: 1, kind: 'community', alpha: 0.5 },
      projected,
      1,
      '#ff0000',
      0,
      0,
    );
    expect(ctx.strokeStyle).toBe('#6b7280');
    expect(ctx.setLineDash).toHaveBeenCalledWith([]);
  });
});
