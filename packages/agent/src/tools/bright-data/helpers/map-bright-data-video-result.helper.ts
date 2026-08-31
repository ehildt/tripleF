import { buildYoutubeThumbnailUrl } from '../../helpers/build-youtube-thumbnail-url.helper.js';
import { SOURCE } from '../bright-data.constants.js';
import type { BrightDataVideoSearchResponse } from '../video-search.types.js';

type BrightDataVideoItem = NonNullable<BrightDataVideoSearchResponse['organic']>[number];

/** Normalize a Bright Data video item into the video-search result shape. */
export function mapBrightDataVideoResult(r: BrightDataVideoItem) {
  return {
    title: r.title || '',
    link: r.link || '',
    snippet: r.description || '',
    channel: '',
    duration: r.duration || '',
    date: '',
    // `image` is an embedded base64 thumbnail — derive a direct YouTube
    // thumbnail from the link instead.
    thumbnailUrl: buildYoutubeThumbnailUrl(r.link || '') ?? '',
    source: SOURCE,
    views: 0,
  };
}
