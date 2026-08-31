import { describe, expect, it } from 'vitest';

import { drawNode } from './draw-node.helper';

const makeCtx = () =>
  ({
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    shadowColor: '',
    shadowBlur: 0,
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  }) as unknown as CanvasRenderingContext2D;

const projected = [{ x: 10, y: 20, scale: 1 }];

const params = {
  index: 0,
  projected,
  zoom: 1,
  isHovered: false,
  isHub: false,
  linkCount: 2,
  maxLinkCount: 4,
  color: '#8b5cf6',
  time: 0,
  isTopic: false,
  isRoot: false,
  memberCount: 0,
  opacity: 1,
  isFriction: false,
  isSuperseded: false,
};

describe('drawNode', () => {
  it('paints one dot circle at the projected point', () => {
    const ctx = makeCtx();
    drawNode(ctx, params);

    expect(ctx.arc).toHaveBeenCalledWith(
      10,
      20,
      expect.any(Number),
      0,
      Math.PI * 2,
    );
    expect(ctx.fill).toHaveBeenCalled();
  });

  it('adds a halo ring and a heat shadow fill for hub dots', () => {
    const ctx = makeCtx();
    drawNode(ctx, { ...params, isHub: true });

    // Halo + dot + shadow re-fill = three fills, two circles.
    expect(ctx.arc).toHaveBeenCalledTimes(2);
    expect(ctx.fill).toHaveBeenCalledTimes(3);
  });

  it('outlines category dots', () => {
    const ctx = makeCtx();
    drawNode(ctx, { ...params, isTopic: true });

    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.lineWidth).toBe(1.5);
  });

  it('renders the ZERO root as a soft radial gradient with no hard border', () => {
    const ctx = makeCtx();
    drawNode(ctx, { ...params, isRoot: true });

    expect(ctx.createRadialGradient).toHaveBeenCalledWith(
      10,
      20,
      0,
      10,
      20,
      13.5,
    );
    expect(ctx.stroke).not.toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalledTimes(1);
  });

  it('draws two slim grayed rings around a multi-leaf category dot', () => {
    const ctx = makeCtx();
    drawNode(ctx, { ...params, isTopic: true, memberCount: 3 });

    // Halo + dot + two rings = four arcs.
    expect(ctx.arc).toHaveBeenCalledTimes(4);
    // Outline + two rings = three strokes.
    expect(ctx.stroke).toHaveBeenCalledTimes(3);
  });

  it('keeps the soft radial halo for multi-leaf dots', () => {
    const ctx = makeCtx();
    drawNode(ctx, { ...params, isTopic: true, memberCount: 3 });

    expect(ctx.createRadialGradient).toHaveBeenCalled();
    // Halo gradient + dot = two fills.
    expect(ctx.fill).toHaveBeenCalledTimes(2);
  });

  it('skips the rings for a single-leaf category dot', () => {
    const ctx = makeCtx();
    drawNode(ctx, { ...params, isTopic: true, memberCount: 1 });

    expect(ctx.stroke).toHaveBeenCalledTimes(1);
  });

  it('pulses a black ring around friction and superseded dots', () => {
    const ctx = makeCtx();
    drawNode(ctx, { ...params, isFriction: true });

    // Dot + pulse ring = two arcs; the pulse ring is a stroke.
    expect(ctx.arc).toHaveBeenCalledTimes(2);
    expect(ctx.stroke).toHaveBeenCalledTimes(1);
    expect(ctx.strokeStyle).toContain('rgba(0, 0, 0');

    const supersededCtx = makeCtx();
    drawNode(supersededCtx, { ...params, isSuperseded: true });
    expect(supersededCtx.stroke).toHaveBeenCalledTimes(1);
    expect(supersededCtx.strokeStyle).toContain('rgba(0, 0, 0');
  });
});
