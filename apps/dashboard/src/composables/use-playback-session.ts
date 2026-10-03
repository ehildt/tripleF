import { computed, ref } from 'vue';

import { usePlaybackAnchorStore } from '@/stores/playback-anchor';
import { usePlaylistStore } from '@/stores/playlist';
import { usePopoutSettingsStore } from '@/stores/popout-settings';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

const PLAYLIST_AUTOPLAY_STORAGE_KEY = 'vision-playlist-autoplay';

function loadPlaylistAutoplayEnabled(): boolean {
  try {
    return localStorage.getItem(PLAYLIST_AUTOPLAY_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * The single app-level playback session: which video is launched, the
 * now-playing facts every surface highlights, the play/pause request signal
 * the player applies to its own element, and the docked-overlay derivations
 * that used to live in the anchor store. It owns data and data-mutations only
 * — it never holds a component handle or commands a component.
 *
 * Created once on first use and shared by import across the tree; the
 * floating player receives it as a prop, and chat surfaces read the same
 * instance through `usePlaybackSession`.
 */
export function createPlaybackSession() {
  const playbackAnchorStore = usePlaybackAnchorStore();
  const popoutSettingsStore = usePopoutSettingsStore();
  const playlistStore = usePlaylistStore();

  // ── Launched video ──────────────────────────────────────
  const launchedVideo = ref<VideoGalleryItem | null>(null);
  const launchedFromPlaylist = ref(false);
  const launchedPlaylistQueue = ref<VideoGalleryItem[]>([]);

  // ── Now playing ─────────────────────────────────────────
  const activePlaybackVideoUrl = ref<string | null>(null);
  const nowPlayingTitle = ref('');

  // ── Player state (reported by the player, not commanded) ─
  const activePlaybackPlaying = ref(false);
  const activePlaybackControlSupported = ref(false);

  // ── Preferences / window knobs ─────────────────────────
  const playlistAutoplayEnabled = ref(loadPlaylistAutoplayEnabled());
  const floatingPopupOpacity = ref(1);

  /** Docked playlist tab visibility — read by the app-level marquee. */
  const dockedPlaylistPanelVisible = ref(false);

  /**
   * One-shot play/pause request. The floating player host watches this
   * counter and applies the toggle to its own player — the session itself
   * never touches a player element.
   */
  const playbackToggleRequestId = ref(0);

  function setActivePlayback(videoUrl: string, title?: string) {
    if (activePlaybackVideoUrl.value !== videoUrl) {
      nowPlayingTitle.value = title ?? '';
    } else if (title !== undefined) {
      nowPlayingTitle.value = title;
    }
    activePlaybackVideoUrl.value = videoUrl;
  }

  function clearActivePlayback() {
    activePlaybackVideoUrl.value = null;
    nowPlayingTitle.value = '';
  }

  function launchVideo(
    item: VideoGalleryItem,
    playlist?: { videos: VideoGalleryItem[] },
  ) {
    launchedVideo.value = item;
    launchedFromPlaylist.value = Boolean(playlist);
    launchedPlaylistQueue.value = playlist?.videos ?? [];
    setActivePlayback(item.videoUrl, item.title);
    playbackAnchorStore.resetDockForLaunch();
  }

  function closeLaunchedVideo() {
    launchedVideo.value = null;
    launchedFromPlaylist.value = false;
    launchedPlaylistQueue.value = [];
    clearActivePlayback();
    popoutSettingsStore.releaseFloatingPopupRect();
  }

  function stopPlayback() {
    if (launchedVideo.value) closeLaunchedVideo();
    clearActivePlayback();
    activePlaybackPlaying.value = false;
  }

  function playNextPlaylistVideo(): boolean {
    const queue = launchedPlaylistQueue.value;
    const current = launchedVideo.value;
    if (!current || queue.length === 0) return false;

    const currentIndex = queue.findIndex(
      (item) => item.videoUrl === current.videoUrl,
    );
    const next = queue
      .slice(currentIndex + 1)
      .find((item) => playlistStore.isVideoInActivePlaylist(item.videoUrl));
    if (!next) return false;

    launchedVideo.value = next;
    setActivePlayback(next.videoUrl, next.title);
    return true;
  }

  function togglePlaylistAutoplay() {
    playlistAutoplayEnabled.value = !playlistAutoplayEnabled.value;
    try {
      localStorage.setItem(
        PLAYLIST_AUTOPLAY_STORAGE_KEY,
        String(playlistAutoplayEnabled.value),
      );
    } catch {
      /* storage unavailable — the preference stays in-memory only */
    }
  }

  function requestPlaybackToggle() {
    playbackToggleRequestId.value += 1;
  }

  /** The player reports its observed state back as data. */
  function reportPlaying(playing: boolean) {
    activePlaybackPlaying.value = playing;
  }

  function reportControlSupported(supported: boolean) {
    activePlaybackControlSupported.value = supported;
  }

  function setDockedPlaylistPanelVisible(visible: boolean) {
    dockedPlaylistPanelVisible.value = visible;
  }

  function setFloatingPopupOpacity(opacity: number) {
    floatingPopupOpacity.value = opacity;
  }

  // ── Docked overlay derivations (single source of truth) ─
  const launchedAnchorCandidates = computed(() =>
    launchedVideo.value
      ? (playbackAnchorStore.anchorCandidates.get(
          launchedVideo.value.videoUrl,
        ) ?? [])
      : [],
  );

  const visibleAnchorCandidate = computed(
    () =>
      launchedAnchorCandidates.value.find(
        (entry) => entry.inView && (entry.dockCondition?.() ?? true),
      ) ?? null,
  );

  const dockedAnchorCandidate = computed(() => {
    if (playbackAnchorStore.playbackDockMode !== 'auto') return null;
    if (!launchedVideo.value) return null;
    if (
      popoutSettingsStore.popoutHideOnPlaylist &&
      launchedFromPlaylist.value
    ) {
      return null;
    }
    if (popoutSettingsStore.popoutEnabled) {
      return visibleAnchorCandidate.value;
    }
    return launchedAnchorCandidates.value[0] ?? null;
  });

  const dockedAnchorElement = computed(
    () => dockedAnchorCandidate.value?.el ?? null,
  );
  const dockedAnchorScrollRoot = computed(
    () => dockedAnchorCandidate.value?.scrollRoot ?? null,
  );
  const dockedInline = computed(() => dockedAnchorElement.value !== null);

  /** Dock intent: snap inline when a figure is visible, else hide-but-play. */
  function dockPlayback() {
    playbackAnchorStore.dockPlayback(visibleAnchorCandidate.value !== null);
  }

  return {
    launchedVideo,
    launchedFromPlaylist,
    launchedPlaylistQueue,
    activePlaybackVideoUrl,
    nowPlayingTitle,
    activePlaybackPlaying,
    activePlaybackControlSupported,
    playlistAutoplayEnabled,
    floatingPopupOpacity,
    dockedPlaylistPanelVisible,
    playbackToggleRequestId,
    launchVideo,
    closeLaunchedVideo,
    stopPlayback,
    playNextPlaylistVideo,
    togglePlaylistAutoplay,
    requestPlaybackToggle,
    reportPlaying,
    reportControlSupported,
    setDockedPlaylistPanelVisible,
    setFloatingPopupOpacity,
    launchedAnchorCandidates,
    visibleAnchorCandidate,
    dockedAnchorCandidate,
    dockedAnchorElement,
    dockedAnchorScrollRoot,
    dockedInline,
    dockPlayback,
    engagePlayback: playbackAnchorStore.engagePlayback,
    dismissPlaybackWindow: playbackAnchorStore.dismissPlaybackWindow,
    latchFloating: playbackAnchorStore.latchFloating,
  };
}

export type PlaybackSession = ReturnType<typeof createPlaybackSession>;

let session: PlaybackSession | null = null;

/**
 * Read the app-level playback session singleton. Created lazily on first use
 * and shared by import across the tree — the floating player receives it as a
 * prop, and chat surfaces read the same instance through this composable.
 */
export function usePlaybackSession(): PlaybackSession {
  session ??= createPlaybackSession();
  return session;
}
