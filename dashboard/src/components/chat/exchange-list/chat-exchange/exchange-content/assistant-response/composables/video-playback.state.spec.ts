import { beforeEach, describe, expect, it } from 'vitest';

import {
  activePlaybackVideoUrl,
  addedPlaylistVideos,
  addPlaylistVideo,
  closeLaunchedVideo,
  isPlaylistVideo,
  launchedFromPlaylist,
  launchedVideo,
  launchVideo,
  nowPlayingTitle,
  playNextPlaylistVideo,
  removePlaylistVideo,
  replacePlaylistVideos,
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
    addPlaylistVideo('conversation-1', item);
    addPlaylistVideo('conversation-1', nextItem);
    launchVideo(item, {
      videos: [item, nextItem],
      conversationId: 'conversation-1',
    });
    expect(launchedFromPlaylist.value).toBe(true);
    expect(playNextPlaylistVideo()).toBe(true);
  });

  it('a standalone launch clears any stale queue from a previous playlist launch', () => {
    addPlaylistVideo('conversation-1', item);
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

describe('video-playback.state replace playlist videos', () => {
  beforeEach(() => {
    localStorage.clear();
    closeLaunchedVideo();
    addedPlaylistVideos.value = new Map();
  });

  it('replaces the conversation playlist with the loaded videos', () => {
    addPlaylistVideo('conversation-1', item);
    replacePlaylistVideos('conversation-1', [nextItem]);
    expect(isPlaylistVideo('conversation-1', item.videoUrl)).toBe(false);
    expect(isPlaylistVideo('conversation-1', nextItem.videoUrl)).toBe(true);
  });

  it('dedupes by url and ignores entries without one', () => {
    replacePlaylistVideos('conversation-1', [
      item,
      { ...item, title: 'Duplicate' },
      { videoUrl: '', title: 'No url' },
    ]);
    expect(addedPlaylistVideos.value.get('conversation-1')).toHaveLength(1);
  });

  it('persists the replacement to localStorage', () => {
    replacePlaylistVideos('conversation-1', [item]);
    const raw = localStorage.getItem('vision-playlist-videos');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)['conversation-1']).toHaveLength(1);
  });

  it('is a no-op without a conversation id', () => {
    replacePlaylistVideos('', [item]);
    expect(addedPlaylistVideos.value.size).toBe(0);
  });

  it('keeps the launched video playing when the load leaves it behind', () => {
    launchVideo(item, playlist);
    replacePlaylistVideos('conversation-1', [nextItem]);
    expect(launchedVideo.value).toEqual(item);
  });

  it('keeps the launched video when it is part of the load', () => {
    launchVideo(item, playlist);
    replacePlaylistVideos('conversation-1', [item, nextItem]);
    expect(launchedVideo.value).toEqual(item);
  });
});

describe('video-playback.state remove playlist video', () => {
  beforeEach(() => {
    localStorage.clear();
    closeLaunchedVideo();
    addedPlaylistVideos.value = new Map();
  });

  it('removing the playing video does not interrupt playback', () => {
    addPlaylistVideo('conversation-1', item);
    launchVideo(item, playlist);
    removePlaylistVideo('conversation-1', item.videoUrl);
    expect(launchedVideo.value).toEqual(item);
    expect(activePlaybackVideoUrl.value).toBe(item.videoUrl);
    expect(isPlaylistVideo('conversation-1', item.videoUrl)).toBe(false);
  });
});
