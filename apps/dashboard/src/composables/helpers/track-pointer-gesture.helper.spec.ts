import { describe, expect, it, vi } from 'vitest';

import { trackPointerGesture } from './track-pointer-gesture.helper';

function makeTarget(): HTMLElement {
  const el = document.createElement('div');
  el.setPointerCapture = vi.fn();
  el.releasePointerCapture = vi.fn();
  el.hasPointerCapture = () => true;
  return el;
}

function pointerEvent(type: string): PointerEvent {
  return new PointerEvent(type, { pointerId: 7 });
}

describe('trackPointerGesture', () => {
  it('captures the pointer on the target', () => {
    const target = makeTarget();
    trackPointerGesture(target, pointerEvent('pointerdown'), vi.fn());
    expect(target.setPointerCapture).toHaveBeenCalledWith(7);
  });

  it('forwards pointermove events to the move handler', () => {
    const target = makeTarget();
    const onMove = vi.fn();
    trackPointerGesture(target, pointerEvent('pointerdown'), onMove);

    target.dispatchEvent(pointerEvent('pointermove'));
    expect(onMove).toHaveBeenCalledOnce();
  });

  it('ends the gesture on pointerup, releasing capture and calling onEnd', () => {
    const target = makeTarget();
    const onEnd = vi.fn();
    trackPointerGesture(target, pointerEvent('pointerdown'), vi.fn(), onEnd);

    target.dispatchEvent(pointerEvent('pointerup'));

    expect(target.releasePointerCapture).toHaveBeenCalledWith(7);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('pointercancel also ends the gesture', () => {
    const target = makeTarget();
    const onEnd = vi.fn();
    trackPointerGesture(target, pointerEvent('pointerdown'), vi.fn(), onEnd);

    target.dispatchEvent(pointerEvent('pointercancel'));

    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('stops listening after the gesture ends', () => {
    const target = makeTarget();
    const onMove = vi.fn();
    trackPointerGesture(target, pointerEvent('pointerdown'), onMove, vi.fn());

    target.dispatchEvent(pointerEvent('pointerup'));
    target.dispatchEvent(pointerEvent('pointermove'));

    expect(onMove).not.toHaveBeenCalled();
  });
});
