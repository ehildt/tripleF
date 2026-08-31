import type {
  ExtractedVideoItem,
  VideoBucket,
  VideoCandidate,
} from '../extract-media-from-tools.types.js';

/** Stamp a video item with its pool bucket. */
export function mapItemWithBucket(
  item: ExtractedVideoItem,
  bucket: VideoBucket,
): VideoCandidate {
  return { ...item, bucket };
}
