import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';

import {
  dockedAnchorCandidate,
  dockedAnchorElement,
  dockPlayback,
  engagePlayback,
  latchFloating,
  playbackDockMode,
  registerAnchorCandidate,
  setAnchorCandidateInView,
  unregisterAnchorCandidate,
  visibleAnchorCandidate,
} from './playback-anchor.state';
import { popoutEnabled } from './popout-settings.state';
import { closeLaunchedVideo, launchVideo } from './video-playback.state';

const video = {
  videoUrl: 'https://www.youtube.com/watch?v=abc',
  title: 'Some video',
};

const otherVideo = {
  videoUrl: 'https://youtu.be/other',
  title: 'Other video',
};

/** Track registrations per test so they can be unregistered afterwards. */
let cleanups: Array<() => void> = [];

function register(
  url: string,
  scrollRoot: HTMLElement | null = null,
  dockCondition?: () => boolean,
) {
  const el = document.createElement('div');
  const candidate = registerAnchorCandidate(url, el, scrollRoot, dockCondition);
  cleanups.push(() => unregisterAnchorCandidate(url, candidate));
  return candidate;
}

describe('playback-anchor.state', () => {
  beforeEach(() => {
    localStorage.clear();
    closeLaunchedVideo();
    for (const cleanup of cleanups) cleanup();
    cleanups = [];
    popoutEnabled.value = true;
    engagePlayback();
  });

  it('registers candidates optimistically in-view for the launched video', () => {
    register(video.videoUrl);
    launchVideo(video);
    expect(visibleAnchorCandidate.value).not.toBeNull();
    expect(dockedAnchorElement.value).not.toBeNull();
  });

  it('only anchors the launched video url', () => {
    register(otherVideo.videoUrl);
    launchVideo(video);
    expect(visibleAnchorCandidate.value).toBeNull();
    expect(dockedAnchorElement.value).toBeNull();
  });

  it('loses the anchor when its figure unregisters (tab/conversation switch)', () => {
    const candidate = register(video.videoUrl);
    launchVideo(video);
    expect(dockedAnchorElement.value).not.toBeNull();
    unregisterAnchorCandidate(video.videoUrl, candidate);
    expect(visibleAnchorCandidate.value).toBeNull();
    expect(dockedAnchorElement.value).toBeNull();
  });

  it('prefers the in-view figure when several surfaces share a video url', () => {
    const hidden = register(video.videoUrl);
    const visible = register(video.videoUrl);
    launchVideo(video);
    setAnchorCandidateInView(video.videoUrl, hidden, false);
    expect(visibleAnchorCandidate.value).toBe(visible);
  });

  it('ignores an in-view candidate whose dock condition is false (carousel side slide)', () => {
    const dockable = ref(true);
    const candidate = register(video.videoUrl, null, () => dockable.value);
    launchVideo(video);
    expect(visibleAnchorCandidate.value).toBe(candidate);
    expect(dockedAnchorElement.value).toBe(candidate.el);

    dockable.value = false;
    expect(visibleAnchorCandidate.value).toBeNull();
    expect(dockedAnchorElement.value).toBeNull();

    dockable.value = true;
    expect(visibleAnchorCandidate.value).toBe(candidate);
  });

  it('docked anchor follows visibility with popouts enabled', () => {
    const candidate = register(video.videoUrl);
    launchVideo(video);
    setAnchorCandidateInView(video.videoUrl, candidate, false);
    expect(dockedAnchorCandidate.value).toBeNull();
    setAnchorCandidateInView(video.videoUrl, candidate, true);
    expect(dockedAnchorCandidate.value).toBe(candidate);
  });

  it('keeps docking to its figure with popouts disabled, even scrolled out', () => {
    popoutEnabled.value = false;
    const candidate = register(video.videoUrl);
    launchVideo(video);
    setAnchorCandidateInView(video.videoUrl, candidate, false);
    expect(dockedAnchorCandidate.value).toBe(candidate);
  });

  it('dockPlayback docks inline when a figure is visible', () => {
    register(video.videoUrl);
    launchVideo(video);
    dockPlayback();
    expect(playbackDockMode.value).toBe('auto');
    expect(dockedAnchorElement.value).not.toBeNull();
  });

  it('dockPlayback dismisses to the hidden window when nothing is visible', () => {
    const candidate = register(video.videoUrl);
    launchVideo(video);
    setAnchorCandidateInView(video.videoUrl, candidate, false);
    dockPlayback();
    expect(playbackDockMode.value).toBe('dock-dismissed');
    expect(dockedAnchorElement.value).toBeNull();
  });

  it('engagement re-follows the anchor after a dismissal', () => {
    const candidate = register(video.videoUrl);
    launchVideo(video);
    setAnchorCandidateInView(video.videoUrl, candidate, false);
    dockPlayback();
    engagePlayback();
    expect(playbackDockMode.value).toBe('auto');
  });

  it('the float latch holds floating until docked (autodock-off semantics)', () => {
    const candidate = register(video.videoUrl);
    launchVideo(video);
    setAnchorCandidateInView(video.videoUrl, candidate, false);
    latchFloating();
    expect(playbackDockMode.value).toBe('float-latched');
    setAnchorCandidateInView(video.videoUrl, candidate, true);
    expect(dockedAnchorElement.value).toBeNull();
    dockPlayback();
    expect(playbackDockMode.value).toBe('auto');
    expect(dockedAnchorElement.value).not.toBeNull();
  });

  it('latchFloating is a no-op outside auto mode', () => {
    const candidate = register(video.videoUrl);
    launchVideo(video);
    setAnchorCandidateInView(video.videoUrl, candidate, false);
    dockPlayback();
    latchFloating();
    expect(playbackDockMode.value).toBe('dock-dismissed');
  });

  it('a fresh launch resets the dock mode to auto', () => {
    const candidate = register(video.videoUrl);
    launchVideo(video);
    setAnchorCandidateInView(video.videoUrl, candidate, false);
    dockPlayback();
    launchVideo(otherVideo);
    expect(playbackDockMode.value).toBe('auto');
  });
});
