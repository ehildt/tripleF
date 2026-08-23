import { describe, expect, it, vi } from 'vitest';

import { useBlink } from './use-blink';

describe('useBlink', () => {
  it('starts with isBlinking false', () => {
    const { isBlinking } = useBlink();
    expect(isBlinking.value).toBe(false);
  });

  it('blinking is true after start()', () => {
    const { isBlinking, start } = useBlink();
    start();
    expect(isBlinking.value).toBe(true);
  });

  it('blinking is false after stop()', () => {
    const { isBlinking, start, stop } = useBlink();
    start();
    expect(isBlinking.value).toBe(true);
    stop();
    expect(isBlinking.value).toBe(false);
  });

  it('blinks for a default duration', () => {
    vi.useFakeTimers();
    const { isBlinking, blink } = useBlink(1000);
    blink();
    expect(isBlinking.value).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(isBlinking.value).toBe(false);
    vi.useRealTimers();
  });

  it('blink accepts a custom duration', () => {
    vi.useFakeTimers();
    const { isBlinking, blink } = useBlink(500);
    blink(200);
    vi.advanceTimersByTime(199);
    expect(isBlinking.value).toBe(true);
    vi.advanceTimersByTime(1);
    expect(isBlinking.value).toBe(false);
    vi.useRealTimers();
  });

  it('calling start clears an existing timer', () => {
    vi.useFakeTimers();
    const { start, blink, isBlinking } = useBlink(1000);
    blink();
    start();
    vi.advanceTimersByTime(1000);
    expect(isBlinking.value).toBe(true);
    vi.useRealTimers();
  });
});
