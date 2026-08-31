import { buildYoutubeThumbnailUrl } from '../../helpers/build-youtube-thumbnail-url.helper.js';
import type { SerperVideoSearchResponse } from '../video-search.types.js';

type SerperVideoItem = NonNullable<SerperVideoSearchResponse['videos']>[number];

/**
 * Normalize a Serper video item (with its repaired link) into the
 * video-search result shape.
 */
export function mapSerperVideoResult(input: { r: SerperVideoItem; link: string }) {
  const { r, link } = input;
  return {
    title: r.title,
    link,
    // Keep the provider's original link when it had to be repaired —
    // auditability for provider-side payload corruption.
    ...(link !== r.link ? { originalLink: r.link } : {}),
    snippet: r.snippet || '',
    channel: r.channel || '',
    duration: r.duration || '',
    date: r.date || '',
    // Serper thumbnails are Google proxy images (blocked by our image
    // trust rules) — derive a direct thumbnail for YouTube instead.
    // maxresdefault is not guaranteed to exist; consumers degrade to
    // hqdefault/mqdefault on failure.
    thumbnailUrl: buildYoutubeThumbnailUrl(link) ?? '',
    source: r.source || '',
    views: r.views ?? 0,
  };
}
