import { computed, ref } from 'vue';

import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { releaseFloatingPopupRect } from './popout-settings.state';

/**
 * Shared playback state: the URL of the video the user most recently engaged
 * (clicked play on). This is the single mounted player: inline figures
 * render as posters until they become the active playback, so at most one
 * real player exists on the page at a time. Both the videolist response
 * cards and the right-panel playlist read it to highlight the current video.
 */
export const activePlaybackVideoUrl = ref<string | null>(null);

/**
 * Title of the currently playing video, shown in the playlist panel's
 * animated "now playing" text. Tracked alongside the active playback so a
 * video that was never added to a playlist (hero media, gallery videos)
 * still announces itself there.
 */
export const nowPlayingTitle = ref('');

export function setActivePlayback(videoUrl: string, title?: string) {
  if (activePlaybackVideoUrl.value !== videoUrl) {
    nowPlayingTitle.value = title ?? '';
  } else if (title !== undefined) {
    // A repeated engage (e.g. iframe window blur) may name the video for
    // the first time — adopt the title without disturbing playback.
    nowPlayingTitle.value = title;
  }
  activePlaybackVideoUrl.value = videoUrl;
}

export function clearActivePlayback() {
  activePlaybackVideoUrl.value = null;
  nowPlayingTitle.value = '';
}

/**
 * Transport state for the single mounted player. usePausablePlayer registers
 * play/pause controls when a provider supports programmatic control
 * (YouTube, direct video, Vimeo) and reports play-state changes here, so
 * the playlist bar can drive the current video no matter how far the user
 * scrolled away from it.
 */
export const activePlaybackPlaying = ref(false);

const activePlaybackHasControls = ref(false);
let activePlayerControls: { play(): void; pause(): void } | null = null;

export function setActivePlaybackPlaying(playing: boolean) {
  activePlaybackPlaying.value = playing;
}

export function registerActivePlayerControls(controls: {
  play(): void;
  pause(): void;
}) {
  activePlayerControls = controls;
  activePlaybackHasControls.value = true;
}

/** Only the owner instance may clear its registration — teardown ordering
 *  between the old and new player must not wipe the new registration. */
export function unregisterActivePlayerControls(controls: {
  play(): void;
  pause(): void;
}) {
  if (activePlayerControls !== controls) return;
  activePlayerControls = null;
  activePlaybackHasControls.value = false;
}

/** Whether the currently mounted player supports programmatic play/pause. */
export const activePlaybackControlSupported = computed(
  () => activePlaybackHasControls.value,
);

/** Toggle play/pause on the mounted player. No-op without controls. */
export function toggleActivePlayback() {
  if (!activePlayerControls) return;
  if (activePlaybackPlaying.value) activePlayerControls.pause();
  else activePlayerControls.play();
}

/**
 * Stop playback entirely: closes the launched popup or drops the inline
 * figure back to its poster, and clears the highlight everywhere (the
 * highlight is driven by activePlaybackVideoUrl).
 */
export function stopActivePlayback() {
  if (launchedVideo.value) closeLaunchedVideo();
  clearActivePlayback();
  setActivePlaybackPlaying(false);
}

/**
 * The video launched from the playlist panel, rendered by the standalone
 * floating player host. Null when no launched video is up. While a launched
 * video exists it is the only mounted player: inline figures stay posters.
 */
export const launchedVideo = ref<VideoGalleryItem | null>(null);

/**
 * The playlist the launched video came from (ordered, as shown in the
 * panel), captured at launch so autoplay can advance through it. Empty
 * when the video was not launched from a playlist.
 */
const launchedPlaylistQueue = ref<VideoGalleryItem[]>([]);
const launchedPlaylistConversationId = ref('');

export function launchVideo(
  item: VideoGalleryItem,
  playlist?: { videos: VideoGalleryItem[]; conversationId: string },
) {
  launchedVideo.value = item;
  if (playlist) {
    launchedPlaylistQueue.value = playlist.videos;
    launchedPlaylistConversationId.value = playlist.conversationId;
  }
  setActivePlayback(item.videoUrl, item.title);
}

export function closeLaunchedVideo() {
  launchedVideo.value = null;
  launchedPlaylistQueue.value = [];
  launchedPlaylistConversationId.value = '';
  clearActivePlayback();
  releaseFloatingPopupRect();
}

/**
 * Dock the launched video back onto the page without stopping it: the
 * floating window closes but the video stays the active playback, so an
 * inline figure with the same URL mounts the player right away (or floats
 * it again while scrolled out). The playlist queue is dropped — playlist
 * autoplay belongs to the launched player only.
 */
export function dockLaunchedVideo() {
  launchedVideo.value = null;
  launchedPlaylistQueue.value = [];
  launchedPlaylistConversationId.value = '';
  releaseFloatingPopupRect();
}

/**
 * The conversation's playlist: videos the user explicitly added from a
 * videolist card, keyed by conversation id so playlists do not leak into
 * other conversations. Persisted to localStorage (one record per
 * conversation) so a conversation's playlist survives reloads.
 */
const PLAYLIST_VIDEOS_STORAGE_KEY = 'vision-playlist-videos';

const MAX_PLAYLIST_VIDEOS = 50;

function loadAddedPlaylistVideos(): Map<string, VideoGalleryItem[]> {
  try {
    const raw = localStorage.getItem(PLAYLIST_VIDEOS_STORAGE_KEY);
    if (!raw) return new Map();
    return new Map(
      Object.entries(JSON.parse(raw)) as [string, VideoGalleryItem[]][],
    );
  } catch {
    return new Map();
  }
}

function persistAddedPlaylistVideos(map: Map<string, VideoGalleryItem[]>) {
  try {
    localStorage.setItem(
      PLAYLIST_VIDEOS_STORAGE_KEY,
      JSON.stringify(Object.fromEntries(map)),
    );
  } catch {
    /* storage full or unavailable — the playlist stays in-memory only */
  }
}

export const addedPlaylistVideos = ref(loadAddedPlaylistVideos());

function writeAddedPlaylistVideos(
  conversationId: string,
  videos: VideoGalleryItem[],
) {
  const next = new Map(addedPlaylistVideos.value);
  next.set(conversationId, videos);
  addedPlaylistVideos.value = next;
  persistAddedPlaylistVideos(next);
}

export function isPlaylistVideo(
  conversationId: string,
  videoUrl: string,
): boolean {
  return (
    addedPlaylistVideos.value
      .get(conversationId)
      ?.some((item) => item.videoUrl === videoUrl) ?? false
  );
}

/**
 * Add a video to the conversation's playlist (deduped by URL, capped).
 * Newly added videos append at the end, keeping add order.
 */
export function addPlaylistVideo(
  conversationId: string,
  item: VideoGalleryItem,
) {
  if (!conversationId || !item.videoUrl) return;
  const current = addedPlaylistVideos.value.get(conversationId) ?? [];
  if (current.some((video) => video.videoUrl === item.videoUrl)) return;
  if (current.length >= MAX_PLAYLIST_VIDEOS) return;
  writeAddedPlaylistVideos(conversationId, [...current, item]);
}

/** Remove a video from the conversation's playlist. */
export function removePlaylistVideo(conversationId: string, videoUrl: string) {
  if (!conversationId) return;
  const current = addedPlaylistVideos.value.get(conversationId) ?? [];
  writeAddedPlaylistVideos(
    conversationId,
    current.filter((item) => item.videoUrl !== videoUrl),
  );

  if (launchedVideo.value?.videoUrl === videoUrl) closeLaunchedVideo();
}

/**
 * Whether the launched player advances to the next playlist video when the
 * current one ends. Persisted so the preference survives reloads.
 */
const PLAYLIST_AUTOPLAY_STORAGE_KEY = 'vision-playlist-autoplay';

function loadPlaylistAutoplayEnabled(): boolean {
  try {
    return localStorage.getItem(PLAYLIST_AUTOPLAY_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export const playlistAutoplayEnabled = ref(loadPlaylistAutoplayEnabled());

export function togglePlaylistAutoplay() {
  playlistAutoplayEnabled.value = !playlistAutoplayEnabled.value;
  try {
    localStorage.setItem(
      PLAYLIST_AUTOPLAY_STORAGE_KEY,
      String(playlistAutoplayEnabled.value),
    );
  } catch {
    /* storage unavailable — the toggle stays in-memory only */
  }
}

/**
 * Advance the launched player to the next video in the playlist queue
 * captured at launch, skipping videos removed from the playlist since.
 * Returns false when the current video is the last playable one (or no
 * queue was captured).
 */
export function playNextPlaylistVideo(): boolean {
  const queue = launchedPlaylistQueue.value;
  const current = launchedVideo.value;
  if (!current || queue.length === 0) return false;

  const currentIndex = queue.findIndex(
    (item) => item.videoUrl === current.videoUrl,
  );

  const next = queue
    .slice(currentIndex + 1)
    .find((item) =>
      isPlaylistVideo(launchedPlaylistConversationId.value, item.videoUrl),
    );

  if (!next) return false;

  launchedVideo.value = next;
  setActivePlayback(next.videoUrl, next.title);
  return true;
}

/** Opacity of the floating popup, cycled between 100%, 75%, and 50%. */
export const floatingPopupOpacity = ref(1);
