/**
 * YouTube Data API tool result shapes, mirrored from the server-side tool in
 * `server/src/modules/ai-sdk/tools/sources/youtube.ts`. The tool resolves to
 * `{ results: [...] }`; these types let the client work with typed tool
 * results from harness stream events instead of `unknown`.
 */

/** youtubeVideoSearch — YouTube Data API video results. */
export interface YouTubeVideoResult {
  title: string;
  link: string;
  snippet: string;
  channel: string;
  duration: string;
  date: string;
  thumbnailUrl: string;
  source: string;
  views: number;
  /** Declared language from the YouTube videos.list snippet (uploader-set). */
  lang?: string;
}

/** Union of every YouTube tool result payload. */
export type YouTubeToolResult = {
  results: YouTubeVideoResult[];
  error?: string;
};
