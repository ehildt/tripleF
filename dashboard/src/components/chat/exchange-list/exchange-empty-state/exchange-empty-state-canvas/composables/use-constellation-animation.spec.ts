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

  it('cancels the pending frame when restarted (no stacked loops)', () => {
    const context = createFakeContext();
    const canvas = createFakeCanvas(context);
    const canvasRef = ref<HTMLCanvasElement | null>(canvas);

    let rafCount = 0;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((): number => ++rafCount),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { start, stop } = useConstellationAnimation(canvasRef);
    start();
    start();
    start();

    // Three restarts → the two earlier pending frames were canceled, so
    // exactly one animation loop remains instead of three stacked loops.
    expect(requestAnimationFrame).toHaveBeenCalledTimes(3);
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(2);
    stop();
  });

  it('trickles respawns so dots never fade back in as a synchronized wave', () => {
    const context = createFakeContext();
    const canvas = createFakeCanvas(context);
    const canvasRef = ref<HTMLCanvasElement | null>(canvas);

    // Deterministic: lifetime = 6000ms, respawn delay = 1000ms for every dot.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
    } as MediaQueryList);

    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);

    let frameCallback: FrameRequestCallback | null = null;
    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: FrameRequestCallback): number => {
        frameCallback = callback;
        return 1;
      },
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { start, stop } = useConstellationAnimation(canvasRef);
    start();

    // t=0: births were backdated by half the lifetime — every dot visible.
    frameCallback!(0);
    expect(context.arc).toHaveBeenCalled();
    const visibleAtStart = (context.arc as ReturnType<typeof vi.fn>).mock.calls
      .length;
    expect(visibleAtStart).toBe(40);

    // t=7000: all dots expired (age 10000 > lifetime 6000) in one frame —
    // with trickled respawns (birth = t+1000) none is drawn yet; the old
    // birth=now behavior would have made all 40 fade in together.
    (context.arc as ReturnType<typeof vi.fn>).mockClear();
    now = 7000;
    frameCallback!(0);
    expect(context.arc).not.toHaveBeenCalled();

    // t=8100: the trickled dots fade in 100ms after their appear time, all
    // at a 1000ms offset from the stall instead of the stall frame itself.
    now = 8100;
    frameCallback!(0);
    expect((context.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
      40,
    );

    stop();
    vi.restoreAllMocks();
  });
});
