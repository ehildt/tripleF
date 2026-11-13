import { describe, expect, it } from 'vitest';

import { parsePlaylistFile } from './parse-playlist-file.helper';
import { serializePlaylistFile } from './serialize-playlist-file.helper';

const VIDEO = {
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  title: 'One',
  caption: 'Caption',
  duration: '3:32',
  channel: 'Channel',
  date: '2026-01-02',
  views: 123,
  thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  description: 'Description',
};

describe('parsePlaylistFile', () => {
  it('round-trips every supported metadata field', () => {
    expect(parsePlaylistFile(serializePlaylistFile([VIDEO]))).toEqual([VIDEO]);
  });

  it('accepts empty playlists and strips unknown object fields', () => {
    expect(parsePlaylistFile('{"version":1,"videos":[]}')).toEqual([]);
    expect(
      parsePlaylistFile(
        JSON.stringify({
          version: 1,
          ignored: true,
          videos: [{ ...VIDEO, ignored: 'value' }],
        }),
      ),
    ).toEqual([VIDEO]);
  });

  it.each([
    'not json',
    'null',
    '{}',
    '{"version":2,"videos":[]}',
    '{"version":1,"videos":{}}',
  ])('rejects an invalid document: %s', (text) => {
    expect(() => parsePlaylistFile(text)).toThrow();
  });

  it.each([
    { ...VIDEO, videoUrl: 'javascript:alert(1).mp4' },
    { ...VIDEO, videoUrl: 'https://example.com/not-a-video' },
    { ...VIDEO, views: '123' },
    { ...VIDEO, title: 42 },
  ])(
    'rejects invalid video data without returning a partial queue',
    (video) => {
      const text = JSON.stringify({ version: 1, videos: [VIDEO, video] });
      expect(() => parsePlaylistFile(text)).toThrow(/index 1/);
    },
  );

  it('rejects non-finite numeric metadata produced by JSON overflow', () => {
    expect(() =>
      parsePlaylistFile(
        `{"version":1,"videos":[{"videoUrl":"${VIDEO.videoUrl}","views":1e400}]}`,
      ),
    ).toThrow(/index 0/);
  });
});
