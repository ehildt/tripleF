import { describe, expect, it } from 'vitest';

import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

import { serializePlaylistFile } from './serialize-playlist-file.helper';

const VIDEOS: VideoGalleryItem[] = [
  {
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'One',
    caption: 'Caption',
    duration: '3:32',
    channel: 'Channel',
    date: '2026-01-02',
    views: 123,
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    description: 'Description',
  },
  { videoUrl: 'https://cdn.example.com/two.mp4' },
];

describe('serializePlaylistFile', () => {
  it('writes the versioned lossless format in queue order', () => {
    const serialized = serializePlaylistFile(VIDEOS);

    expect(JSON.parse(serialized)).toEqual({ version: 1, videos: VIDEOS });
    expect(serialized).toContain('\n  "videos": [');
  });

  it('serializes an empty playlist', () => {
    expect(JSON.parse(serializePlaylistFile([]))).toEqual({
      version: 1,
      videos: [],
    });
  });
});
