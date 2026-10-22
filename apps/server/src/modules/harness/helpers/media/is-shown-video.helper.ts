import type { ShownMediaKeys } from '../../services/shown-media.service.types.js';
import { videoUrlKeys } from '../url-trust/video-url-keys.helper.js';

/** Whether a video URL matches any already-shown canonical key. */
export function isShownVideo(keys: ShownMediaKeys, videoUrl: string): boolean {
  return videoUrlKeys(videoUrl).some((key) => keys.videos.has(key));
}
