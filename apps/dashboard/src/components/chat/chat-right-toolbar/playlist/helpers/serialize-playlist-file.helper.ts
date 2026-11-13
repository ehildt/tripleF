import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

import { PLAYLIST_FILE_VERSION } from '../playlist-file.constant';

/** Serialize a playlist queue as the versioned, lossless JSON file format. */
export function serializePlaylistFile(
  videos: readonly VideoGalleryItem[],
): string {
  return JSON.stringify({ version: PLAYLIST_FILE_VERSION, videos }, null, 2);
}
