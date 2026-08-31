import { describe, expect, it } from 'vitest';

import { mapPlaylistSnapshot } from './map-playlist-snapshot.helper.js';

describe('mapPlaylistSnapshot', () => {
  it('projects a playlist row into the snapshot shape', () => {
    const updatedAt = new Date('2025-01-01T00:00:00Z');
    expect(
      mapPlaylistSnapshot({
        sessionId: 's',
        conversationId: 'c',
        name: 'My list',
        videos: [{ url: 'https://example.com' }],
        createdAt: updatedAt,
        updatedAt,
      }),
    ).toEqual({
      name: 'My list',
      conversationId: 'c',
      videos: [{ url: 'https://example.com' }],
      updatedAt,
    });
  });
});
