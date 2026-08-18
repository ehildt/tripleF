import { BLOCKED_IMAGE_HOSTS } from '../../constants/blocked-image-hosts.js';
import {
  BROWSER_USER_AGENT,
  HARNESS_USER_AGENT,
} from '../../constants/user-agents.constant.js';
import { isPrivateOrLocalhost } from '../url-trust/is-private-or-localhost.helper.js';

import type { FetchImageBufferOptions } from './fetch-image-buffer.types.js';

const MAX_REDIRECTS = 3;

/**
 * A URL is only fetchable when it is a public http(s) address that is
 * neither private/localhost nor a known thumbnail-proxy host. Checked on
 * every hop: the initial URL and each redirect target — the download itself
 * is the last enforcement point, earlier URL filters cannot cover
 * time-of-check/time-of-use races or DNS rebinding style redirects.
 */
function isFetchableImageUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  const hostname = parsed.hostname.toLowerCase();
  if (isPrivateOrLocalhost(hostname)) return false;
  if (BLOCKED_IMAGE_HOSTS.has(hostname)) return false;
  return true;
}

/** Read a response body fully into memory — no size ceiling, only the
 * fetch timeout bounds the download. The resolution floor (not a byte cap)
 * is what keeps low-quality images out. */
async function readBody(res: Response): Promise<{ body: Buffer } | undefined> {
  if (!res.body) return undefined;

  const reader = res.body.getReader();
  const chunks: Buffer[] = [];

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
  } catch {
    return undefined;
  } finally {
    reader.releaseLock();
  }

  return { body: Buffer.concat(chunks) };
}

/** Resolve a redirect location against its base URL; invalid → undefined. */
function resolveRedirectTarget(
  base: string,
  location: string | null,
): string | undefined {
  if (!location) return undefined;
  try {
    return new URL(location, base).toString();
  } catch {
    return undefined;
  }
}

/** Fetch one URL without following redirects; network failures → undefined. */
async function fetchWithoutRedirects(
  url: string,
  userAgent: string,
  timeoutMs: number,
): Promise<Response | undefined> {
  try {
    return await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': userAgent },
      redirect: 'manual',
    });
  } catch {
    return undefined;
  }
}

async function fetchImageBufferOnce(
  url: string,
  userAgent: string,
  options: FetchImageBufferOptions,
): Promise<{ body: Buffer } | { forbidden: true } | undefined> {
  let current = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isFetchableImageUrl(current)) return undefined;

    const res = await fetchWithoutRedirects(
      current,
      userAgent,
      options.timeoutMs,
    );
    if (!res) return undefined;
    if (res.status === 403) return { forbidden: true };

    if (res.status >= 300 && res.status < 400) {
      const next = resolveRedirectTarget(current, res.headers.get('location'));
      if (!next) return undefined;
      current = next;
      continue;
    }

    if (!res.ok) return undefined;
    return readBody(res);
  }

  return undefined;
}

/**
 * Download an image URL into a buffer, retrying once with a browser user
 * agent when a hotlink-protecting CDN answers 403. Returns undefined for
 * unreachable, non-public, or blocked URLs. No byte cap — the resolution
 * floor is the quality gate, and the fetch timeout bounds the download.
 */
export async function fetchImageBuffer(
  url: string,
  options: FetchImageBufferOptions,
): Promise<Buffer | undefined> {
  const result = await fetchImageBufferOnce(url, HARNESS_USER_AGENT, options);
  if (!result) return undefined;
  if ('body' in result) return result.body;

  const retried = await fetchImageBufferOnce(url, BROWSER_USER_AGENT, options);
  return retried && 'body' in retried ? retried.body : undefined;
}
