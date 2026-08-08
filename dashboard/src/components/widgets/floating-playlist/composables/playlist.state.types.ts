import type { VideoGalleryItem } from '@/types/harness-response-data.model';

export interface Playlist {
  name: string;
  videos: VideoGalleryItem[];
  /** Conversation the playlist belongs to (part of the DB compound key). */
  conversationId: string;
}
