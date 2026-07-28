import { beforeEach, describe, expect, it } from 'vitest';

import {
  activePlaybackVideoUrl,
  addPlaylistVideo,
  closeLaunchedVideo,
  dockLaunchedVideo,
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

  it('dockLaunchedVideo closes the window but keeps the video selected', () => {
    launchVideo(item, playlist);
    dockLaunchedVideo();
    expect(launchedVideo.value).toBeNull();
    expect(activePlaybackVideoUrl.value).toBe(item.videoUrl);
    expect(nowPlayingTitle.value).toBe(item.title);
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
    const nextItem = { videoUrl: 'https://youtu.be/next', title: 'Next video' };
    launchVideo(item, {
      videos: [item, nextItem],
      conversationId: 'conversation-1',
    });
    // Autoplay skips videos that are no longer in the playlist — add both.
    addPlaylistVideo('conversation-1', item);
    addPlaylistVideo('conversation-1', nextItem);
    expect(playNextPlaylistVideo()).toBe(true);
    expect(nowPlayingTitle.value).toBe('Next video');
  });

  it('clears the title when playback is deselected', () => {
    setActivePlayback('https://youtu.be/1', 'Some title');
    closeLaunchedVideo();
    expect(nowPlayingTitle.value).toBe('');
  });
});
