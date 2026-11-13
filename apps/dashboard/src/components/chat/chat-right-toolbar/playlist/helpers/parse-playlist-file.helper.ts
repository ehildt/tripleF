import { isVideoUrl } from '@/components/chat/shared/helpers/assistant-response/media/is-video-url.helper';
import { isVideoGalleryItem } from '@/composables/use-playlist-catalog/helpers/is-video-gallery-item.helper';
import type { VideoGalleryItem } from '@/types/assistant-response-data.model';

import { PLAYLIST_FILE_VERSION } from '../playlist-file.constant';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function copyVideoMetadata(video: VideoGalleryItem): VideoGalleryItem {
  const copy: VideoGalleryItem = { videoUrl: video.videoUrl };
  if (video.title !== undefined) copy.title = video.title;
  if (video.caption !== undefined) copy.caption = video.caption;
  if (video.duration !== undefined) copy.duration = video.duration;
  if (video.channel !== undefined) copy.channel = video.channel;
  if (video.date !== undefined) copy.date = video.date;
  if (video.views !== undefined) copy.views = video.views;
  if (video.thumbnailUrl !== undefined) copy.thumbnailUrl = video.thumbnailUrl;
  if (video.description !== undefined) copy.description = video.description;
  return copy;
}

/** Parse and validate one versioned playlist JSON document without mutating state. */
export function parsePlaylistFile(text: string): VideoGalleryItem[] {
  let document: unknown;
  try {
    document = JSON.parse(text);
  } catch {
    throw new Error('Playlist file is not valid JSON');
  }

  if (
    !isRecord(document) ||
    document.version !== PLAYLIST_FILE_VERSION ||
    !Array.isArray(document.videos)
  )
    throw new Error('Playlist file has an unsupported format');

  return document.videos.map((candidate: unknown, index: number) => {
    if (
      !isVideoGalleryItem(candidate) ||
      !isVideoUrl(candidate.videoUrl) ||
      (candidate.views !== undefined && !Number.isFinite(candidate.views))
    )
      throw new Error(
        `Playlist file contains an invalid video at index ${index}`,
      );

    return copyVideoMetadata(candidate);
  });
}
