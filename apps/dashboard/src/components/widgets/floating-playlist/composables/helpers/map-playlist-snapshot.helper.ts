import type { VideoGalleryItem } from '@/types/harness-response-data.model';

/** Project a playlist snapshot into the playlist shape. */
export function mapPlaylistSnapshot(snapshot: {
  name: string;
  conversationId: string;
  videos: unknown;
}) {
  return {
    name: snapshot.name,
    conversationId: snapshot.conversationId,
    videos: snapshot.videos as unknown as VideoGalleryItem[],
  };
}
