import { beforeEach, describe, expect, it } from 'vitest';

import {
  setActivePlaylist,
  setPlaylists,
} from '@/components/widgets/floating-playlist/composables/playlist.state';

import {
  activePlaybackVideoUrl,
  closeLaunchedVideo,
  launchedFromPlaylist,
  launchedVideo,
  launchVideo,
  nowPlayingTitle,
  playNextPlaylistVideo,
  setActivePlayback,
} from './video-playback.state';

const item = {
  videoUrl: 'https://www.youtube.com/watch?v=abc',
  title: 'Some video',
};

const playlist = {
  videos: [item],
  conversationId: 'conversation-1',
};

const nextItem = {
  videoUrl: 'https://youtu.be/next',
  title: 'Next video',
};

/** Seed the active playlist so autoplay can advance. */
function seedActivePlaylist(videos: (typeof item)[]) {
  setPlaylists([{ name: 'Focus', videos, conversationId: 'conversation-1' }]);
  setActivePlaylist('Focus');
}

describe('video-playback.state launched video', () => {
  beforeEach(() => {
    localStorage.clear();
    closeLaunchedVideo();
  });

  it('closeLaunchedVideo stops playback and deselects the video', () => {
    launchVideo(item, playlist);
    closeLaunchedVideo();
    expect(launchedVideo.value).toBeNull();
    expect(activePlaybackVideoUrl.value).toBeNull();
  });

  it('marks a playlist launch and keeps its queue for autoplay', () => {
    seedActivePlaylist([item, nextItem]);
    launchVideo(item, {
      videos: [item, nextItem],
      conversationId: 'conversation-1',
    });
    expect(launchedFromPlaylist.value).toBe(true);
    expect(playNextPlaylistVideo()).toBe(true);
  });

  it('a standalone launch clears any stale queue from a previous playlist launch', () => {
    launchVideo(item, {
      videos: [item, nextItem],
      conversationId: 'conversation-1',
    });
    launchVideo(nextItem);
    expect(launchedFromPlaylist.value).toBe(false);
    expect(playNextPlaylistVideo()).toBe(false);
  });

  it('closeLaunchedVideo resets the playlist origin', () => {
    launchVideo(item, playlist);
    closeLaunchedVideo();
    expect(launchedFromPlaylist.value).toBe(false);
  });
});

describe('video-playback.state now playing title', () => {
  beforeEach(() => {
    localStorage.clear();
    closeLaunchedVideo();
  });

  it('tracks the title alongside the active playback', () => {
    setActivePlayback('https://youtu.be/1', 'First title');
    expect(nowPlayingTitle.value).toBe('First title');
    setActivePlayback('https://youtu.be/2');
    expect(nowPlayingTitle.value).toBe('');
  });

  it('adopts a late title for the already active video', () => {
    setActivePlayback('https://youtu.be/1');
    setActivePlayback('https://youtu.be/1', 'Late title');
    expect(nowPlayingTitle.value).toBe('Late title');
  });

  it('takes the title from the launched video', () => {
    launchVideo(item, playlist);
    expect(nowPlayingTitle.value).toBe(item.title);
  });

  it('follows the playlist autoplay advance to the next title', () => {
    seedActivePlaylist([item, nextItem]);
    launchVideo(item, {
      videos: [item, nextItem],
      conversationId: 'conversation-1',
    });
    expect(playNextPlaylistVideo()).toBe(true);
    expect(nowPlayingTitle.value).toBe('Next video');
  });

  it('clears the title when playback is deselected', () => {
    setActivePlayback('https://youtu.be/1', 'Some title');
    closeLaunchedVideo();
    expect(nowPlayingTitle.value).toBe('');
  });
});
