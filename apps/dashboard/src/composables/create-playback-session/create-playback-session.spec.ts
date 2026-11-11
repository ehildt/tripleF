import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePlaybackAnchorRegistry } from '@/composables/use-playback-anchor-registry/use-playback-anchor-registry';
import { usePlaylistStore } from '@/stores/widgets/playlist/playlist.store';
import { usePopoutSettingsStore } from '@/stores/widgets/popout-settings/popout-settings.store';

import { createPlaybackSession } from './create-playback-session';

const VIDEO_ONE = { videoUrl: 'https://video.test/one', title: 'One' };
const VIDEO_TWO = { videoUrl: 'https://video.test/two', title: 'Two' };
const VIDEO_TWO_NO_TITLE = { videoUrl: 'https://video.test/two-no-title' };
const VIDEO_NOT_IN_PLAYLIST = { videoUrl: 'https://video.test/x', title: 'X' };

describe('createPlaybackSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    // Anchor registry is a module-scope singleton — reset it between tests.
    const registry = usePlaybackAnchorRegistry();
    registry.anchorCandidates.value = new Map();
    registry.playbackDockMode.value = 'auto';
  });

  it('launches a video, sets now-playing, and resets the dock for the launch', () => {
    const registry = usePlaybackAnchorRegistry();
    registry.playbackDockMode.value = 'dock-dismissed';

    const session = createPlaybackSession();
    session.launchVideo(VIDEO_ONE, { videos: [VIDEO_ONE, VIDEO_TWO] });

    expect(session.launchedVideo.value).toEqual(VIDEO_ONE);
    expect(session.launchedFromPlaylist.value).toBe(true);
    expect(session.launchedPlaylistQueue.value).toHaveLength(2);
    expect(session.activePlaybackVideoUrl.value).toBe(VIDEO_ONE.videoUrl);
    expect(session.nowPlayingTitle.value).toBe('One');
    expect(registry.playbackDockMode.value).toBe('auto');
  });

  it('sets the title at launch and clears it for the next untitled video', () => {
    const playlistStore = usePlaylistStore();
    playlistStore.playlists = [
      { name: 'main', videos: [VIDEO_ONE, VIDEO_TWO_NO_TITLE] },
    ];
    playlistStore.activePlaylistName = 'main';

    const session = createPlaybackSession();
    session.launchVideo(VIDEO_ONE, { videos: [VIDEO_ONE, VIDEO_TWO_NO_TITLE] });
    expect(session.nowPlayingTitle.value).toBe('One');

    session.playNextPlaylistVideo();
    expect(session.nowPlayingTitle.value).toBe('');
  });

  it('close and stop both clear the active playback state', () => {
    const session = createPlaybackSession();
    session.launchVideo(VIDEO_ONE);
    session.closeLaunchedVideo();
    expect(session.launchedVideo.value).toBeNull();
    expect(session.activePlaybackVideoUrl.value).toBeNull();

    session.launchVideo(VIDEO_TWO);
    session.stopPlayback();
    expect(session.launchedVideo.value).toBeNull();
    expect(session.activePlaybackPlaying.value).toBe(false);
  });

  it('walks the playlist queue, skipping videos removed from the playlist', () => {
    const playlistStore = usePlaylistStore();
    playlistStore.playlists = [
      { name: 'main', videos: [VIDEO_ONE, VIDEO_TWO] },
    ];
    playlistStore.activePlaylistName = 'main';

    const session = createPlaybackSession();
    session.launchVideo(VIDEO_ONE, {
      videos: [VIDEO_ONE, VIDEO_NOT_IN_PLAYLIST, VIDEO_TWO],
    });

    expect(session.playNextPlaylistVideo()).toBe(true);
    expect(session.launchedVideo.value).toEqual(VIDEO_TWO);
    expect(session.playNextPlaylistVideo()).toBe(false);
  });

  it('returns false advancing without a current video or queue', () => {
    const session = createPlaybackSession();
    expect(session.playNextPlaylistVideo()).toBe(false);
  });

  it('toggles playlist autoplay and persists the preference', () => {
    const session = createPlaybackSession();
    // Unset preference defaults to off; the stored value is the opt-in.
    expect(session.playlistAutoplayEnabled.value).toBe(false);
    session.togglePlaylistAutoplay();
    expect(session.playlistAutoplayEnabled.value).toBe(true);
    expect(localStorage.getItem('vision-playlist-autoplay')).toBe('true');
  });

  it('hydrates a persisted autoplay preference', () => {
    localStorage.setItem('vision-playlist-autoplay', 'true');
    expect(createPlaybackSession().playlistAutoplayEnabled.value).toBe(true);
  });

  it('records player-reported state', () => {
    const session = createPlaybackSession();
    session.reportPlaying(true);
    session.reportControlSupported(true);
    expect(session.activePlaybackPlaying.value).toBe(true);
    expect(session.activePlaybackControlSupported.value).toBe(true);
  });

  it('raises a one-shot toggle counter the player host watches', () => {
    const session = createPlaybackSession();
    const before = session.playbackToggleRequestId.value;
    session.requestPlaybackToggle();
    expect(session.playbackToggleRequestId.value).toBe(before + 1);
  });

  it('hydrates valid remembered popup geometry', () => {
    localStorage.setItem(
      'vision-popout-rect',
      JSON.stringify({ x: 10, y: 20, width: 300, height: 200 }),
    );

    expect(createPlaybackSession().floatingPopupRect.value).toEqual({
      x: 10,
      y: 20,
      width: 300,
      height: 200,
    });
  });

  it('does not hydrate popup geometry while position memory is disabled', () => {
    localStorage.setItem('vision-popout-remember-position', 'false');
    localStorage.setItem(
      'vision-popout-rect',
      JSON.stringify({ x: 10, y: 20, width: 300, height: 200 }),
    );

    expect(createPlaybackSession().floatingPopupRect.value).toBeNull();
  });

  it('persists geometry only with memory enabled and clears both copies', () => {
    const session = createPlaybackSession();
    const rect = { x: 10, y: 20, width: 300, height: 200 };
    session.setFloatingPopupRect(rect);

    session.rememberFloatingPopupRect();
    expect(
      JSON.parse(localStorage.getItem('vision-popout-rect') ?? 'null'),
    ).toEqual(rect);

    usePopoutSettingsStore().setPopoutRememberPosition(false);
    localStorage.removeItem('vision-popout-rect');
    session.rememberFloatingPopupRect();
    expect(localStorage.getItem('vision-popout-rect')).toBeNull();

    session.setFloatingPopupRect(rect);
    localStorage.setItem('vision-popout-rect', JSON.stringify(rect));
    session.clearFloatingPopupRect();
    expect(session.floatingPopupRect.value).toBeNull();
    expect(localStorage.getItem('vision-popout-rect')).toBeNull();
  });

  it('releases geometry on close only when position memory is disabled', () => {
    const session = createPlaybackSession();
    const rect = { x: 1, y: 2, width: 300, height: 200 };
    session.setFloatingPopupRect(rect);
    session.launchVideo(VIDEO_ONE);
    session.closeLaunchedVideo();
    expect(session.floatingPopupRect.value).toEqual(rect);

    session.setFloatingPopupRect(rect);
    usePopoutSettingsStore().setPopoutRememberPosition(false);
    session.launchVideo(VIDEO_ONE);
    session.closeLaunchedVideo();
    expect(session.floatingPopupRect.value).toBeNull();
  });

  it('picks the visible in-view anchor when the popout is enabled', () => {
    const registry = usePlaybackAnchorRegistry();
    usePopoutSettingsStore().popoutEnabled = true;

    const el = document.createElement('div');
    registry.registerAnchorCandidate(VIDEO_ONE.videoUrl, el, null);

    const session = createPlaybackSession();
    session.launchVideo(VIDEO_ONE);

    expect(session.dockedAnchorElement.value).toBe(el);
    expect(session.dockedInline.value).toBe(true);
  });

  it('suppresses the dock when the hide-on-playlist setting applies', () => {
    const registry = usePlaybackAnchorRegistry();
    const popout = usePopoutSettingsStore();
    popout.popoutEnabled = true;
    popout.popoutHideOnPlaylist = true;

    registry.registerAnchorCandidate(
      VIDEO_ONE.videoUrl,
      document.createElement('div'),
      null,
    );

    const session = createPlaybackSession();
    session.launchVideo(VIDEO_ONE, { videos: [VIDEO_ONE] });

    expect(session.dockedAnchorCandidate.value).toBeNull();
    expect(session.dockedInline.value).toBe(false);
  });

  it('falls back to the first candidate when the popout is disabled', () => {
    const registry = usePlaybackAnchorRegistry();
    usePopoutSettingsStore().popoutEnabled = false;

    const el = document.createElement('div');
    registry.registerAnchorCandidate(VIDEO_ONE.videoUrl, el, null);

    const nonInViewSession = createPlaybackSession();
    nonInViewSession.launchVideo(VIDEO_ONE);
    expect(nonInViewSession.dockedAnchorElement.value).toBe(el);
  });

  it('never docks outside auto dock mode', () => {
    const registry = usePlaybackAnchorRegistry();
    usePopoutSettingsStore().popoutEnabled = true;
    registry.registerAnchorCandidate(
      VIDEO_ONE.videoUrl,
      document.createElement('div'),
      null,
    );

    const session = createPlaybackSession();
    session.launchVideo(VIDEO_ONE);
    registry.playbackDockMode.value = 'float-latched';

    expect(session.dockedAnchorCandidate.value).toBeNull();
  });

  it('delegates dock intent to the registry with the visibility result', () => {
    const registry = usePlaybackAnchorRegistry();
    const session = createPlaybackSession();

    session.dockPlayback(); // no visible anchor → dismiss, audio keeps playing
    expect(registry.playbackDockMode.value).toBe('dock-dismissed');
  });
});
