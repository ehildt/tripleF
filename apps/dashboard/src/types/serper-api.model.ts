/**
 * Serper.dev tool result shapes, mirrored from the server-side tools in
 * `server/src/modules/ai-sdk/tools/sources/serper.ts`. Each Serper tool
 * resolves to `{ results: [...] }` (or `{ content, title }` for webpage
 * fetch); these types let the client work with typed tool results from
 * harness stream events instead of `unknown`.
 */

/** serperWebSearch — organic Google results. */
export interface SerperOrganicResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

/** serperImageSearch — Google Images results (720p floor enforced server-side). */
export interface SerperImageResult {
  title: string;
  imageUrl: string;
  sourcePageUrl: string;
  width?: number;
  height?: number;
  source: string;
  domain: string;
}

/** serperNewsSearch — Google News results. */
export interface SerperNewsResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  date: string;
  imageUrl: string;
}

/** serperVideoSearch — Google Videos results. */
export interface SerperVideoResult {
  title: string;
  link: string;
  snippet: string;
  channel: string;
  duration: string;
  date: string;
  thumbnailUrl: string;
  source: string;
  views: number;
}

/** serperShoppingSearch — Google Shopping offers. */
export interface SerperShoppingResult {
  title: string;
  price: string;
  link: string;
  source: string;
  imageUrl: string;
  delivery: string;
  rating?: number;
  ratingCount?: number;
}

/** serperPlacesSearch — Google Maps businesses. */
export interface SerperPlaceResult {
  title: string;
  address: string;
  phoneNumber: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  ratingCount?: number;
  type: string;
  website: string;
  cid: string;
}

/** serperBusinessReviewsSearch — individual Google Maps reviews of a business. */
export interface SerperReviewResult {
  author: string;
  snippet: string;
  rating?: number;
  date: string;
  likes: number;
  place: string;
}

/** Aggregate info about the reviewed business, when Serper resolved it. */
export interface SerperReviewPlaceInfo {
  title: string;
  address: string;
  rating?: number;
  ratingCount?: number;
}

/** serperWebpageScrape — rendered page text. */
export interface SerperWebpageScrapeResult {
  content: string;
  title?: string;
  error?: string;
}

/** Union of every Serper tool result payload. */
export type SerperToolResult =
  | { results: SerperOrganicResult[]; error?: string }
  | { results: SerperImageResult[]; error?: string }
  | { results: SerperNewsResult[]; error?: string }
  | { results: SerperVideoResult[]; error?: string }
  | { results: SerperShoppingResult[]; error?: string }
  | { results: SerperPlaceResult[]; error?: string }
  | {
      results: SerperReviewResult[];
      place?: SerperReviewPlaceInfo;
      error?: string;
    }
  | SerperWebpageScrapeResult;

/** A tool result entry as streamed in harness events. */
export interface HarnessToolResult<T = unknown> {
  toolName: string;
  result: T;
}
