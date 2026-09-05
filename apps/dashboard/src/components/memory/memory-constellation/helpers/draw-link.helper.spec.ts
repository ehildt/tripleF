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
  it('draws a solid topic-colored curve for intra edges', () => {
    const ctx = makeCtx();
    const link: PreparedLink = { a: 0, b: 1, kind: 'intra', alpha: 0.5 };
    drawLink(ctx, link, projected, 1, '#ff0000', 0, 0);

    expect(ctx.strokeStyle).toBe('#ff0000');
    expect(ctx.setLineDash).toHaveBeenCalledWith([]);
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
  });

  it('draws a gray dashed curve for strong inter edges', () => {
    const ctx = makeCtx();
    const link: PreparedLink = {
      a: 0,
      b: 1,
      kind: 'inter',
      alpha: 0.5,
      score: 0.99,
    };
    drawLink(ctx, link, projected, 1, '#ff0000', 0, 0);

    expect(ctx.strokeStyle).toBe('#6b7280');
    expect(ctx.setLineDash).toHaveBeenCalledWith([4, 4]);
  });

  it('renders weak inter edges as droplets only, with no line', () => {
    const ctx = makeCtx();
    const link: PreparedLink = {
      a: 0,
      b: 1,
      kind: 'inter',
      alpha: 0.5,
      score: 0.8,
      weak: true,
    };
    drawLink(ctx, link, projected, 1, '#ff0000', 0, 0);

    expect(ctx.quadraticCurveTo).not.toHaveBeenCalled();
    expect(ctx.stroke).not.toHaveBeenCalled();
    // 9 droplets (score 0.8) × (glow + core) circles.
    expect(ctx.arc).toHaveBeenCalledTimes(18);
    // Weak droplets are gray, not the source topic color.
    expect(ctx.fillStyle).toContain('rgba(107, 114, 128');
  });

  it('varies droplet speed and phase so they do not march in lockstep', () => {
    const ctx = makeCtx();
    drawLink(
      ctx,
      { a: 0, b: 1, kind: 'inter', alpha: 0.5, score: 0.8, weak: true },
      projected,
      1,
      '#000',
      0,
      0,
    );

    // Each droplet draws glow + core at the same (x, y); sample the three
    // distinct x positions and confirm they are not evenly spaced thirds.
    const xs = [0, 2, 4]
      .map((i) => ctx.arc.mock.calls[i][0])
      .sort((p, q) => p - q);
    expect(xs[1] - xs[0]).not.toBeCloseTo(xs[2] - xs[1]);
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

    // 9 droplets (score 0.8) × (glow + core) circles on the inter edge, none
    // on intra.
    expect(interCalls).toBe(18);
    expect(intraCalls).toBe(18);
  });

  it('draws sibling and cluster edges as solid gray lines', () => {
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
      { a: 0, b: 1, kind: 'cluster', alpha: 0.5 },
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
