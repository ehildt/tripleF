import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlaybackSession } from '@/composables/create-playback-session/create-playback-session';
import type { usePopoutSettingsStore } from '@/stores/widgets/popout-settings/popout-settings.store';

import type { PopupGeometryControls } from './use-popup-geometry.types';

interface PopupGeometryTestContext {
  geometry: PopupGeometryControls;
  playback: PlaybackSession;
  settings: ReturnType<typeof usePopoutSettingsStore>;
  popup: HTMLElement;
  bar: HTMLElement;
  resizeHandle: HTMLElement;
}

function prepareGestureTarget(target: HTMLElement): void {
  target.setPointerCapture = vi.fn();
  target.releasePointerCapture = vi.fn();
  target.hasPointerCapture = vi.fn(() => true);
}

async function loadPopupGeometry(): Promise<PopupGeometryTestContext> {
  const [
    { usePopupGeometry },
    { usePlaybackSession },
    { usePopoutSettingsStore },
  ] = await Promise.all([
    import('./use-popup-geometry'),
    import('@/composables/use-playback-session/use-playback-session'),
    import('@/stores/widgets/popout-settings/popout-settings.store'),
  ]);
  const playback = usePlaybackSession();
  const settings = usePopoutSettingsStore();
  const geometry = usePopupGeometry();
  const popup = document.createElement('div');
  const bar = document.createElement('div');
  const resizeHandle = document.createElement('div');
  popup.append(bar, resizeHandle);
  popup.getBoundingClientRect = vi.fn(() => new DOMRect(100, 100, 480, 320));
  prepareGestureTarget(bar);
  prepareGestureTarget(resizeHandle);
  document.body.append(popup);
  return { geometry, playback, settings, popup, bar, resizeHandle };
}

describe('usePopupGeometry', () => {
  beforeEach(() => {
    vi.resetModules();
    setActivePinia(createPinia());
    localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('uses the configured anchor until explicit geometry exists', async () => {
    const { geometry, playback } = await loadPopupGeometry();

    expect(geometry.popupStyle.value).toMatchObject({
      opacity: '1',
      right: '3rem',
      bottom: '3rem',
    });

    playback.setFloatingPopupRect({ x: 10, y: 20, width: 300, height: 200 });
    expect(geometry.popupStyle.value).toEqual({
      opacity: '1',
      left: '10px',
      top: '20px',
      width: '300px',
      height: '200px',
    });
  });

  it('drags through the playback setter and persists only on pointerup', async () => {
    const { geometry, playback, bar } = await loadPopupGeometry();
    bar.addEventListener('pointerdown', geometry.startDrag);

    bar.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 7,
        clientX: 110,
        clientY: 120,
      }),
    );
    bar.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerId: 7,
        clientX: 160,
        clientY: 180,
      }),
    );

    expect(playback.floatingPopupRect.value).toEqual({
      x: 150,
      y: 160,
      width: 480,
      height: 320,
    });
    expect(localStorage.getItem('vision-popout-rect')).toBeNull();

    bar.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7 }));
    expect(
      JSON.parse(localStorage.getItem('vision-popout-rect') ?? 'null'),
    ).toEqual(playback.floatingPopupRect.value);
  });

  it('does not persist a completed gesture when position memory is off', async () => {
    const { geometry, settings, bar } = await loadPopupGeometry();
    settings.setPopoutRememberPosition(false);
    bar.addEventListener('pointerdown', geometry.startDrag);

    bar.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 7,
        clientX: 110,
        clientY: 120,
      }),
    );
    bar.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 7 }));

    expect(localStorage.getItem('vision-popout-rect')).toBeNull();
  });

  it('resizes with the aspect ratio and persists at gesture end', async () => {
    const { geometry, playback, resizeHandle } = await loadPopupGeometry();
    resizeHandle.addEventListener('pointerdown', (event) => {
      geometry.startResize('se', event);
    });

    resizeHandle.dispatchEvent(
      new PointerEvent('pointerdown', { pointerId: 9, clientX: 0, clientY: 0 }),
    );
    resizeHandle.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerId: 9,
        clientX: 48,
        clientY: 32,
      }),
    );
    resizeHandle.dispatchEvent(new PointerEvent('pointerup', { pointerId: 9 }));

    expect(playback.floatingPopupRect.value).toEqual({
      x: 100,
      y: 100,
      width: 528,
      height: 352,
    });
    expect(
      JSON.parse(localStorage.getItem('vision-popout-rect') ?? 'null'),
    ).toEqual(playback.floatingPopupRect.value);
  });

  it('snaps opacity near quarter steps and adjusts finely elsewhere', async () => {
    const { geometry, playback } = await loadPopupGeometry();

    geometry.setOpacity(74);
    expect(playback.floatingPopupOpacity.value).toBe(0.75);

    geometry.setOpacity(60);
    expect(playback.floatingPopupOpacity.value).toBeCloseTo(0.6);
    expect(geometry.popupStyle.value.opacity).toBe('0.6');
  });
});
