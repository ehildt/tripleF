import type { VideoStats, YoutubeSearchResponse } from '../youtube.types.js';

type YoutubeSearchItem = NonNullable<YoutubeSearchResponse['items']>[number];

/** Convert an ISO 8601 duration (PT#H#M#S) to an H:MM:SS / M:SS label. */
function formatIsoDuration(iso?: string): string {
  const match = iso?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return '';
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** Normalize a YouTube search item into the video-search result shape. */
export function mapYoutubeVideoResult(item: YoutubeSearchItem, stats: Map<string, VideoStats>) {
  const snippet = item.snippet ?? {};
  const id = item.id!.videoId!;
  const detail = stats.get(id);
  const thumbs = snippet.thumbnails ?? {};
  return {
    title: snippet.title ?? '',
    link: `https://www.youtube.com/watch?v=${id}`,
    snippet: snippet.description ?? '',
    channel: snippet.channelTitle ?? '',
    duration: formatIsoDuration(detail?.duration),
    date: snippet.publishedAt ?? '',
    thumbnailUrl: thumbs.maxres?.url ?? thumbs.high?.url ?? thumbs.medium?.url ?? '',
    source: 'youtube',
    views: detail?.viewCount ?? 0,
    lang: detail?.lang,
  };
}
