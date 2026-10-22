import { beforeEach, describe, expect, it, vi } from 'vitest';

import { drawIcon } from './draw-icon.helper';

/** A Path2D stub collecting moveTo/lineTo calls. */
class Path2DStub {
  moves: unknown[] = [];
  lines: unknown[] = [];
  closed = false;
  added: unknown[] = [];
  moveTo(...args: number[]) {
    this.moves.push(args);
  }
  lineTo(...args: number[]) {
    this.lines.push(args);
  }
  addPath(path: Path2DStub) {
    this.added.push(path);
  }
  closePath() {
    this.closed = true;
  }
}

function makeCtx(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    restore: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    beginPath: vi.fn(),
    globalAlpha: 1,
    strokeStyle: '',
  } as unknown as CanvasRenderingContext2D;
}

describe('drawIcon', () => {
  beforeEach(() => {
    vi.stubGlobal('Path2D', Path2DStub);
  });

  it('returns false for an unknown icon name', () => {
    const ctx = makeCtx();
    expect(drawIcon(ctx, 'not-a-real-icon', 0, 0, 12, '#fff', 1)).toBe(false);
    expect(ctx.save).not.toHaveBeenCalled();
  });

  it('translates/scales to the target center and draws a known icon', () => {
    const ctx = makeCtx();
    expect(drawIcon(ctx, 'activity', 10, 20, 24, '#fff', 0.8)).toBe(true);
    expect(ctx.translate).toHaveBeenCalledWith(-2, 8);
    expect(ctx.scale).toHaveBeenCalledOnce();
    expect(ctx.restore).toHaveBeenCalledOnce();
  });
});
