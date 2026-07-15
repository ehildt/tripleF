import { isEmbeddableVideoUrl } from './is-embeddable-video-url.helper.js';
import { isTrustedImageUrl } from './is-trusted-image-url.helper.js';
import { isTrustedUrl } from './is-trusted-url.helper.js';

/**
 * Markdown image syntax in fetched page text: ![alt](url). Fetch tools like
 * Browserbase return markdown, so HTML tag patterns alone are not enough.
 */
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\([^)]*\)/g;

/** Markdown link whose target is an image file: [text](url.jpg) — keep the text. */
const MARKDOWN_IMAGE_LINK_PATTERN =
  /\[([^\]]*)\]\([^)]*\.(?:jpe?g|png|gif|webp|bmp|tiff?|avif|svg|ico)(?:\?[^)]*)?\)/gi;

/**
 * Bare URLs ending in an image file extension. Catches plain-text URLs and
 * URLs inside HTML attributes the tag patterns leave behind (e.g. <a href>
 * or og:image meta tags), so the model cannot re-emit unprobed image URLs.
 */
const BARE_IMAGE_URL_PATTERN =
  /https?:\/\/[^\s)"'<>]+?\.(?:jpe?g|png|gif|webp|bmp|tiff?|avif|svg|ico)(?![a-z0-9])(?:\?[^\s)"'<>]*)?/gi;

/** Remove asset/embedded URLs from webpage fetch content. */
const ASSET_TAG_PATTERNS = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
  /<link\b[^>]*>/gi,
  /<img\b[^>]*>/gi,
  /<picture\b[^>]*>[\s\S]*?<\/picture>/gi,
  /<figure\b[^>]*>[\s\S]*?<\/figure>/gi,
  /<svg\b[^>]*>[\s\S]*?<\/svg>/gi,
  /<video\b[^>]*>[\s\S]*?<\/video>/gi,
  /<audio\b[^>]*>[\s\S]*?<\/audio>/gi,
  /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^>]*>[\s\S]*?<\/object>/gi,
];

function extractUrlField(
  item: Record<string, unknown>,
  primaryKey: string,
): string | undefined {
  const candidates = [item[primaryKey], item.url, item.link];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim())
      return candidate.trim();
  }
  return undefined;
}

function isResultWithResults(
  result: unknown,
): result is { results: Array<Record<string, unknown>> } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'results' in result &&
    Array.isArray((result as Record<string, unknown>).results)
  );
}

function isFetchResult(
  result: unknown,
): result is { content?: string; title?: string } {
  return (
    typeof result === 'object' &&
    result !== null &&
    ('content' in result || 'text' in result)
  );
}

/** Options shared by the per-tool sanitizers. */
interface SanitizeToolResultOptions {
  ingestedByUrl?: Map<string, { imageUrl: string; title?: string }>;
  /** Image/thumbnail URLs that failed live probing — blanked out in place. */
  brokenImageUrls?: Set<string>;
  /** Article/page URLs that failed live probing — their results are dropped. */
  brokenPageUrls?: Set<string>;
}

function scrubThumbnailUrl(
  item: Record<string, unknown>,
  brokenImageUrls?: Set<string>,
): Record<string, unknown> {
  const thumbnailUrl = item.thumbnailUrl;
  if (typeof thumbnailUrl !== 'string' || !thumbnailUrl) return item;
  return brokenImageUrls?.has(thumbnailUrl)
    ? { ...item, thumbnailUrl: '' }
    : item;
}

function sanitizeImageSearchResult(
  result: unknown,
  options?: SanitizeToolResultOptions,
): unknown {
  if (!isResultWithResults(result)) return result;
  return {
    ...result,
    results: result.results
      .map((r) => ({ ...r }))
      .filter(
        (r) =>
          extractUrlField(r, 'imageUrl') &&
          isTrustedImageUrl(extractUrlField(r, 'imageUrl')!) &&
          !options?.brokenImageUrls?.has(extractUrlField(r, 'imageUrl')!),
      )
      .map((r) => {
        const original = extractUrlField(r, 'imageUrl')!;
        const replacement = options?.ingestedByUrl?.get(original);
        if (replacement) {
          return {
            ...r,
            imageUrl: replacement.imageUrl,
            title: replacement.title ?? r.title,
          };
        }
        return r;
      }),
  };
}

function sanitizeVideoSearchResult(
  result: unknown,
  options?: SanitizeToolResultOptions,
): unknown {
  if (!isResultWithResults(result)) return result;
  return {
    ...result,
    results: result.results
      .map((r) => ({ ...r }))
      .filter(
        (r) =>
          extractUrlField(r, 'videoUrl') &&
          isEmbeddableVideoUrl(extractUrlField(r, 'videoUrl')!),
      )
      .map((r) => scrubThumbnailUrl(r, options?.brokenImageUrls)),
  };
}

function sanitizeWebSearchResult(
  result: unknown,
  options?: SanitizeToolResultOptions,
): unknown {
  if (!isResultWithResults(result)) return result;
  return {
    ...result,
    results: result.results
      .map((r) => ({ ...r }))
      .filter((r) => {
        const url = extractUrlField(r, 'url');
        return (
          url &&
          isTrustedUrl(url, { allowPrivate: false }) &&
          !options?.brokenPageUrls?.has(url)
        );
      })
      .map((r) => {
        const withThumbnail = scrubThumbnailUrl(r, options?.brokenImageUrls);
        const imageUrl = extractUrlField(withThumbnail, 'imageUrl');
        if (!imageUrl) return withThumbnail;
        if (
          !isTrustedImageUrl(imageUrl) ||
          options?.brokenImageUrls?.has(imageUrl)
        )
          return { ...withThumbnail, imageUrl: '' };
        const replacement = options?.ingestedByUrl?.get(imageUrl);
        if (replacement) {
          return {
            ...withThumbnail,
            imageUrl: replacement.imageUrl,
            title: replacement.title ?? withThumbnail.title,
          };
        }
        return withThumbnail;
      }),
  };
}

function sanitizeFetchResult(result: unknown): unknown {
  if (!isFetchResult(result)) return result;
  let content = result.content ?? '';
  for (const pattern of ASSET_TAG_PATTERNS) {
    content = content.replace(pattern, ' ');
  }
  content = content.replace(MARKDOWN_IMAGE_PATTERN, ' ');
  content = content.replace(MARKDOWN_IMAGE_LINK_PATTERN, '$1');
  content = content.replace(BARE_IMAGE_URL_PATTERN, ' ');
  // Normalize whitespace in fetch content
  content = content.replace(/\s+/g, ' ').trim();
  return { ...result, content };
}

function isFetchTool(toolName: string): boolean {
  return (
    toolName === 'webFetch' ||
    toolName.endsWith('WebpageFetch') ||
    toolName.endsWith('Fetch')
  );
}

/** Replace original external image URLs inside tool results with local storage URLs after ingestion. */
export function sanitizeToolResultsWithIngestedUrls(
  toolResults: Array<{ toolName: string; result: unknown }>,
  ingestedByUrl: Map<string, { imageUrl: string; title?: string }>,
  brokenImageUrls?: Set<string>,
  brokenPageUrls?: Set<string>,
): Array<{ toolName: string; result: unknown }> {
  return toolResults.map((tr) => {
    const options = { ingestedByUrl, brokenImageUrls, brokenPageUrls };
    if (tr.toolName.endsWith('ImageSearch')) {
      return {
        toolName: tr.toolName,
        result: sanitizeImageSearchResult(tr.result, options),
      };
    }
    if (
      tr.toolName === 'webSearch' ||
      tr.toolName.endsWith('WebSearch') ||
      tr.toolName.endsWith('NewsSearch')
    ) {
      return {
        toolName: tr.toolName,
        result: sanitizeWebSearchResult(tr.result, options),
      };
    }
    return tr;
  });
}

/**
 * Per-tool sanitizer dispatcher. Filters out untrusted URLs and removes asset/embedded markup from fetch content.
 */
export function sanitizeToolResult(
  toolName: string,
  result: unknown,
  options?: SanitizeToolResultOptions,
): unknown {
  if (toolName.endsWith('ImageSearch'))
    return sanitizeImageSearchResult(result, options);
  if (toolName.endsWith('VideoSearch'))
    return sanitizeVideoSearchResult(result, options);
  if (
    toolName === 'webSearch' ||
    toolName.endsWith('WebSearch') ||
    toolName.endsWith('NewsSearch')
  ) {
    return sanitizeWebSearchResult(result, options);
  }
  if (isFetchTool(toolName)) return sanitizeFetchResult(result);
  return result;
}
