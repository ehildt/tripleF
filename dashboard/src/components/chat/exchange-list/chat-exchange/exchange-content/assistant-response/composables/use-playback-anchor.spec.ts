import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import {
  dockPlayback,
  playbackDockMode,
  visibleAnchorCandidate,
} from './playback-anchor.state';
import { popoutEnabled } from './popout-settings.state';
import { usePlaybackAnchor } from './use-playback-anchor';
import {
  closeLaunchedVideo,
  launchedFromPlaylist,
  launchedVideo,
} from './video-playback.state';

interface MockIntersectionEntry {
  isIntersecting: boolean;
  intersectionRatio: number;
}

let observerCallback: ((entries: MockIntersectionEntry[]) => void) | null =
  null;

class MockIntersectionObserver {
  constructor(callback: (entries: MockIntersectionEntry[]) => void) {
    observerCallback = callback;
  }
  observe() {}
  disconnect() {}
}

window.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

function intersect(isIntersecting: boolean) {
  observerCallback?.([
    { isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 },
  ]);
}

const videoUrl = 'https://www.youtube.com/watch?v=abc';

let wrappers: Array<{ unmount(): void }> = [];

/** Mount a figure, returning the composable API. */
function mountFigure(title?: string) {
  const item = ref({ videoUrl, title });
  let api!: ReturnType<typeof usePlaybackAnchor>;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = usePlaybackAnchor(item);
        api.setAnchorElement(document.createElement('div'));
        return () => h('div');
      },
    }),
  );
  wrappers.push(wrapper);
  return api;
}

describe('usePlaybackAnchor', () => {
  beforeEach(() => {
    localStorage.clear();
    closeLaunchedVideo();
    popoutEnabled.value = true;
    observerCallback = null;
  });

  afterEach(() => {
    // Unmount every figure so their anchors unregister between tests.
    for (const wrapper of wrappers) wrapper.unmount();
    wrappers = [];
  });

  it('engage launches the video standalone (no playlist queue)', () => {
    const api = mountFigure('Some video');
    api.engage();
    expect(launchedVideo.value?.videoUrl).toBe(videoUrl);
    expect(launchedVideo.value?.title).toBe('Some video');
    expect(launchedFromPlaylist.value).toBe(false);
  });

  it('docks the player over this figure while it is in view', () => {
    const api = mountFigure();
    api.engage();
    expect(api.isLaunchedHere.value).toBe(true);
    expect(api.isDockedHere.value).toBe(true);
  });

  it('undocks when the figure scrolls out, redocks when back (autodock on)', () => {
    const api = mountFigure();
    api.engage();
    intersect(false);
    expect(api.isDockedHere.value).toBe(false);
    expect(visibleAnchorCandidate.value).toBeNull();
    intersect(true);
    expect(api.isDockedHere.value).toBe(true);
  });

  it('docking while scrolled out hides the window; re-engagement revives it', () => {
    const api = mountFigure();
    api.engage();
    intersect(false);
    dockPlayback();
    expect(playbackDockMode.value).toBe('dock-dismissed');
    api.engage();
    expect(playbackDockMode.value).toBe('auto');
    expect(api.isDockedHere.value).toBe(true);
  });

  it('unmount unregisters the anchor — the player keeps floating without it', () => {
    const api = mountFigure();
    api.engage();
    expect(api.isDockedHere.value).toBe(true);
    wrappers[0].unmount();
    wrappers = [];
    expect(visibleAnchorCandidate.value).toBeNull();
  });
});
