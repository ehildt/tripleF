import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

/** Project a playlist snapshot into the playlist shape. */
export function mapPlaylistSnapshot(snapshot: {
  name: string;
  videos: unknown;
}) {
  return {
    name: snapshot.name,
    videos: snapshot.videos as unknown as VideoGalleryItem[],
  };
}
