import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useConstellationAnimation } from './use-constellation-animation';

function createFakeContext() {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function createFakeCanvas(
  context: CanvasRenderingContext2D,
): HTMLCanvasElement {
  return {
    getContext: vi.fn().mockReturnValue(context),
    getBoundingClientRect: vi.fn().mockReturnValue({ width: 200, height: 100 }),
  } as unknown as HTMLCanvasElement;
}

describe('useConstellationAnimation', () => {
  it('starts and stops without throwing when canvas ref is null', () => {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const { start, stop } = useConstellationAnimation(canvasRef);

    expect(() => start()).not.toThrow();
    expect(() => stop()).not.toThrow();
  });

  it('creates particles and renders the first frame after start', () => {
    const context = createFakeContext();
    const canvas = createFakeCanvas(context);
    const canvasRef = ref<HTMLCanvasElement | null>(canvas);

    let frameCallback: FrameRequestCallback | null = null;
    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: FrameRequestCallback): number => {
        frameCallback = callback;
        return 1;
      },
    );

    const { start } = useConstellationAnimation(canvasRef);
    start();

    expect(canvas.getContext).toHaveBeenCalledWith('2d');
    expect(frameCallback).not.toBeNull();

    frameCallback!(0);
    expect(context.clearRect).toHaveBeenCalled();
  });
});
