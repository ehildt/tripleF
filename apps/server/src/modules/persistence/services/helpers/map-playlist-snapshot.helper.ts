import type { HarnessPlaylist } from '../../../../generated/prisma/client.js';
import type { PlaylistSnapshot } from '../playlist.service.types.js';

/** Project a playlist row into the snapshot shape. */
export function mapPlaylistSnapshot(
  playlist: HarnessPlaylist,
): PlaylistSnapshot {
  return {
    name: playlist.name,
    conversationId: playlist.conversationId,
    videos: playlist.videos as unknown[],
    updatedAt: playlist.updatedAt,
  };
}
