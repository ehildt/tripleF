import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import {
  popoutAutoDock,
  popoutEnabled,
  popoutStopOnClose,
} from './popout-settings.state';
import { useFloatingPlayer } from './use-floating-player';
import {
  activePlaybackVideoUrl,
  clearActivePlayback,
  closeLaunchedVideo,
  nowPlayingTitle,
} from './video-playback.state';

vi.mock('./use-pausable-player', () => ({
  usePausablePlayer: () => ({
    playerSrc: ref('https://www.youtube.com/embed/abc'),
    isDirectVideo: ref(false),
    isUnembeddable: ref(false),
    isYouTubeEmbed: ref(true),
    setPlayerElement: vi.fn(),
  }),
}));

vi.mock('./use-popup-geometry', () => ({
  usePopupGeometry: () => ({
    popupStyle: ref({}),
    startDrag: vi.fn(),
    startResize: vi.fn(),
    setOpacity: vi.fn(),
  }),
}));

let observerCallback:
  ((entries: Array<{ isIntersecting: boolean }>) => void) | null = null;

class MockIntersectionObserver {
  constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
    observerCallback = callback;
  }
  observe() {}
  disconnect() {}
}

window.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

function intersect(isIntersecting: boolean) {
  observerCallback?.([{ isIntersecting }]);
}

function mountFigure(title?: string) {
  const item = ref({ videoUrl: 'https://www.youtube.com/watch?v=abc', title });
  let api!: ReturnType<typeof useFloatingPlayer>;
  mount(
    defineComponent({
      setup() {
        api = useFloatingPlayer(item);
        api.setCardElement(document.createElement('div'));
        return () => h('div');
      },
    }),
  );
  return api;
}

describe('useFloatingPlayer floating behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    closeLaunchedVideo();
    clearActivePlayback();
    popoutEnabled.value = true;
    popoutAutoDock.value = true;
    popoutStopOnClose.value = false;
    observerCallback = null;
  });

  it('floats on scroll-out and autodocks when back in view', () => {
    const figure = mountFigure();
    figure.engage();
    intersect(false);
    expect(figure.isFloating.value).toBe(true);
    intersect(true);
    expect(figure.isFloating.value).toBe(false);
  });

  it('stays floating in view when autodock is off, until dismissed', () => {
    popoutAutoDock.value = false;
    const figure = mountFigure();
    figure.engage();
    intersect(false);
    expect(figure.isFloating.value).toBe(true);
    intersect(true);
    expect(figure.isFloating.value).toBe(true);
    figure.dismissFloating();
    expect(figure.isFloating.value).toBe(false);
  });

  it('floats when engaged while scrolled out (autodock off)', async () => {
    popoutAutoDock.value = false;
    const figure = mountFigure();
    figure.engage();
    await nextTick();
    expect(figure.isFloating.value).toBe(true);
  });

  it('closeFloating docks back inline and keeps the video selected by default', () => {
    const figure = mountFigure();
    figure.engage();
    intersect(false);
    figure.closeFloating();
    expect(figure.isFloating.value).toBe(false);
    expect(activePlaybackVideoUrl.value).toBe(
      'https://www.youtube.com/watch?v=abc',
    );
  });

  it('closeFloating stops and deselects when stop-on-close is on', () => {
    popoutStopOnClose.value = true;
    const figure = mountFigure();
    figure.engage();
    intersect(false);
    figure.closeFloating();
    expect(figure.isFloating.value).toBe(false);
    expect(activePlaybackVideoUrl.value).toBeNull();
  });

  it('close button title reflects the stop-on-close setting', () => {
    const figure = mountFigure();
    expect(figure.closeFloatingTitle.value).toBe('Dock video back inline');
    popoutStopOnClose.value = true;
    expect(figure.closeFloatingTitle.value).toBe('Stop playing');
  });

  it('announces the playing video title for the playlist marquee', () => {
    const figure = mountFigure('Some outside video');
    figure.engage();
    expect(nowPlayingTitle.value).toBe('Some outside video');
  });
});
