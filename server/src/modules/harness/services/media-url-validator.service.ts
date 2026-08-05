import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import sharp from 'sharp';

import { BLOCKED_IMAGE_HOSTS } from '../constants/blocked-image-hosts.js';
import { BLOCKED_URL_HOSTS } from '../constants/url-trust.constants.js';
import {
  BROWSER_USER_AGENT,
  HARNESS_USER_AGENT,
} from '../constants/user-agents.constant.js';
import { isEmbeddableVideoUrl } from '../helpers/is-embeddable-video-url.helper.js';
import { isPrivateOrLocalhost } from '../helpers/is-private-or-localhost.helper.js';
import type { MediaUrlKind } from '../helpers/media-classification/classify-by-content-type.helper.js';
import { classifyByContentType } from '../helpers/media-classification/classify-by-content-type.helper.js';
import { classifyByMagicBytes } from '../helpers/media-classification/classify-by-magic-bytes.helper.js';
import { extractContentType } from '../helpers/media-classification/extract-content-type.helper.js';
import { hasEmptyContent } from '../helpers/media-classification/has-empty-content.helper.js';
import { isImageContentType } from '../helpers/media-classification/is-image-content-type.helper.js';
import { toBuffer } from '../helpers/media-classification/to-buffer.helper.js';

export interface MediaValidationResult {
  url: string;
  kind: MediaUrlKind;
  status?: number;
  contentType?: string;
  error?: string;
}

interface MediaUrlValidatorOptions {
  enabled?: boolean;
  timeoutMs?: number;
  maxRedirects?: number;
  concurrency?: number;
  /** When true, image URLs are fully pinged and dimension-checked. */
  checkImageDimensions?: boolean;
  minWidth?: number;
  minHeight?: number;
  /** Maximum bytes to download when checking image dimensions. */
  maxProbeBytes?: number;
}

/** Structural view of an axios response — avoids a direct axios dependency. */
type HttpResponse = {
  status: number;
  headers: Record<string, unknown>;
  data: unknown;
  request?: { res?: { responseUrl?: string } };
};

type OembedProvider = 'youtube' | 'vimeo' | 'dailymotion';

const OEMBED_ENDPOINTS: Record<OembedProvider, string> = {
  youtube: 'https://www.youtube.com/oembed',
  vimeo: 'https://vimeo.com/api/oembed.json',
  dailymotion: 'https://www.dailymotion.com/services/oembed',
};

const OEMBED_HOST_PROVIDERS: Record<string, OembedProvider> = {
  'youtube.com': 'youtube',
  'www.youtube.com': 'youtube',
  'm.youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'youtube-nocookie.com': 'youtube',
  'www.youtube-nocookie.com': 'youtube',
  'vimeo.com': 'vimeo',
  'www.vimeo.com': 'vimeo',
  'player.vimeo.com': 'vimeo',
  'dailymotion.com': 'dailymotion',
  'www.dailymotion.com': 'dailymotion',
  'dai.ly': 'dailymotion',
};

const CACHE_MAX_ENTRIES = 1000;
const CACHE_HIT_TTL_MS = 5 * 60_000;
const CACHE_MISS_TTL_MS = 60_000;
const UNKNOWN_RETRY_DELAY_MS = 200;

@Injectable()
export class MediaUrlValidatorService {
  private readonly logger = new Logger(MediaUrlValidatorService.name);

  /**
   * Short-TTL result cache keyed by URL + dimension options. Dedupes repeated
   * probes within one sanitize pass (image URLs are collected twice) and
   * across follow-up requests in the same conversation.
   */
  private readonly validationCache = new Map<
    string,
    { result: MediaValidationResult; expiresAt: number }
  >();

  constructor(private readonly httpService: HttpService) {}

  async validateUrls(
    urls: string[],
    options: MediaUrlValidatorOptions = {},
  ): Promise<MediaValidationResult[]> {
    const { enabled = true, concurrency = 5 } = options;

    if (!enabled || urls.length === 0) {
      return urls.map((url) => ({ url, kind: 'unknown' }));
    }

    const results: MediaValidationResult[] = new Array(urls.length);
    const cacheKeys = urls.map((url) => this.buildCacheKey(url, options));
    const pendingIndexes: number[] = [];

    for (let i = 0; i < urls.length; i++) {
      const cached = this.readCache(cacheKeys[i]);
      if (cached) results[i] = cached;
      else pendingIndexes.push(i);
    }

    let cursor = 0;
    const runNext = async (): Promise<void> => {
      const current = cursor++;
      if (current >= pendingIndexes.length) return;

      const urlIndex = pendingIndexes[current];
      const result = await this.validateUrl(urls[urlIndex], options);
      this.writeCache(cacheKeys[urlIndex], result);
      results[urlIndex] = result;
      await runNext();
    };

    const workers: Promise<void>[] = [];
    for (let i = 0; i < Math.min(concurrency, pendingIndexes.length); i++) {
      workers.push(runNext());
    }

    await Promise.all(workers);
    return results;
  }

  private buildCacheKey(
    url: string,
    options: MediaUrlValidatorOptions,
  ): string {
    const dimensions = options.checkImageDimensions
      ? `${options.minWidth ?? 1280}x${options.minHeight ?? 720}`
      : 'no-dimensions';
    return `${dimensions}|${url}`;
  }

  private readCache(key: string): MediaValidationResult | undefined {
    const entry = this.validationCache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.validationCache.delete(key);
      return undefined;
    }
    return entry.result;
  }

  private writeCache(key: string, result: MediaValidationResult): void {
    if (this.validationCache.size >= CACHE_MAX_ENTRIES) {
      const oldestKey = this.validationCache.keys().next().value;
      if (oldestKey) this.validationCache.delete(oldestKey);
    }
    const ttl =
      result.kind === 'broken' || result.kind === 'unknown'
        ? CACHE_MISS_TTL_MS
        : CACHE_HIT_TTL_MS;
    this.validationCache.set(key, { result, expiresAt: Date.now() + ttl });
  }

  /**
   * Validate a single URL. Transient network failures ("unknown") are
   * retried once after a short delay before giving up.
   */
  private async validateUrl(
    url: string,
    options: MediaUrlValidatorOptions,
  ): Promise<MediaValidationResult> {
    let result = await this.probeUrl(url, options);

    if (result.kind === 'unknown' && result.error) {
      await new Promise((resolve) =>
        setTimeout(resolve, UNKNOWN_RETRY_DELAY_MS),
      );
      result = await this.probeUrl(url, options);
    }

    return result;
  }

  private async probeUrl(
    url: string,
    options: MediaUrlValidatorOptions,
  ): Promise<MediaValidationResult> {
    let headResult = await this.tryHead(url, options);

    if (
      headResult.kind === 'unknown' ||
      headResult.kind === 'html' ||
      headResult.kind === 'broken'
    ) {
      const rangeResult = await this.tryRangeGet(url, options);
      if (rangeResult.kind !== 'unknown' && rangeResult.kind !== 'broken') {
        headResult = rangeResult;
      }
    }

    if (headResult.kind === 'html' && isEmbeddableVideoUrl(url)) {
      const oEmbedResult = await this.tryProviderOembed(
        url,
        options.timeoutMs ?? 3000,
      );
      if (oEmbedResult) return oEmbedResult;
      return { ...headResult, kind: 'video' };
    }

    if (
      options.checkImageDimensions &&
      (headResult.kind === 'image' ||
        isImageContentType(headResult.contentType))
    ) {
      return this.tryImageDimensionCheck(url, options, headResult);
    }

    return headResult;
  }

  private async tryImageDimensionCheck(
    url: string,
    options: MediaUrlValidatorOptions,
    preliminary: MediaValidationResult,
  ): Promise<MediaValidationResult> {
    const {
      timeoutMs = 3000,
      maxRedirects = 3,
      minWidth = 1280,
      minHeight = 720,
      maxProbeBytes = 256 * 1024,
    } = options;

    try {
      const response = await this.requestWithUserAgentFallback('get', url, {
        timeoutMs,
        maxRedirects,
        responseType: 'stream',
      });

      const status = response.status;
      if (status >= 400) {
        return { url, kind: 'broken', status, error: preliminary.error };
      }

      if (this.hasUntrustedRedirectTarget(url, response)) {
        return {
          url,
          kind: 'broken',
          status,
          error: 'redirected to untrusted host',
        };
      }

      const contentType = extractContentType(response.headers);
      const chunks: Buffer[] = [];
      let total = 0;

      const metadata = await new Promise<import('sharp').Metadata | undefined>(
        (resolve) => {
          const stream = response.data as NodeJS.ReadableStream;

          const tryParse = () => {
            if (chunks.length === 0) return;
            const buffer = Buffer.concat(chunks);
            sharp(buffer)
              .metadata()
              .then((meta) => {
                if (meta.width && meta.height) {
                  resolve(meta);
                } else {
                  resolve(undefined);
                }
              })
              .catch(() => resolve(undefined));
          };

          stream.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
            total += chunk.length;
            if (total >= maxProbeBytes) {
              (
                stream as NodeJS.ReadableStream & { destroy?: () => void }
              ).destroy?.();
              tryParse();
            }
          });

          stream.on('end', () => tryParse());
          stream.on('error', () => resolve(undefined));
          stream.on('close', () => {
            // If 'end' never fired, still attempt a parse.
            if (total < maxProbeBytes) tryParse();
          });
        },
      );

      if (!metadata || !metadata.width || !metadata.height) {
        // Dimension checking was requested but we could not read dimensions
        // from the first probe bytes. Reject the URL rather than risking a
        // broken or sub-720p image in the gallery.
        return {
          url,
          kind: 'broken',
          status,
          contentType: contentType ?? preliminary.contentType,
          error: 'could not determine image dimensions',
        };
      }

      if (metadata.width < minWidth || metadata.height < minHeight) {
        return {
          url,
          kind: 'broken',
          status,
          contentType,
          error: `image dimensions ${metadata.width}x${metadata.height} below ${minWidth}x${minHeight}`,
        };
      }

      return { url, kind: 'image', status, contentType };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.debug(`Image dimension check failed for ${url}: ${message}`);
      return preliminary;
    }
  }

  /**
   * Verify that an embeddable video page actually exists via the provider's
   * oEmbed endpoint. Returns undefined when the provider has no oEmbed
   * endpoint or the lookup itself fails, so callers can fall back to
   * assuming the video exists.
   */
  private async tryProviderOembed(
    url: string,
    timeoutMs: number,
  ): Promise<MediaValidationResult | undefined> {
    let hostname: string;
    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch {
      return undefined;
    }

    const provider = OEMBED_HOST_PROVIDERS[hostname];
    if (!provider) return undefined;

    const endpoint = `${OEMBED_ENDPOINTS[provider]}?url=${encodeURIComponent(url)}&format=json`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(endpoint, {
          timeout: timeoutMs,
          maxRedirects: 2,
          validateStatus: () => true,
          headers: {
            'User-Agent': HARNESS_USER_AGENT,
          },
        }),
      );

      if (response.status === 200) {
        return { url, kind: 'video', status: response.status };
      }

      return { url, kind: 'broken', status: response.status };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.debug(
        `${provider} oEmbed validation failed for ${url}: ${message}`,
      );
      return undefined;
    }
  }

  private async tryHead(
    url: string,
    options: MediaUrlValidatorOptions,
  ): Promise<MediaValidationResult> {
    const { timeoutMs = 3000, maxRedirects = 3 } = options;
    try {
      const response = await this.requestWithUserAgentFallback('head', url, {
        timeoutMs,
        maxRedirects,
      });

      const contentType = extractContentType(response.headers);
      const status = response.status;

      if (status >= 400) {
        return { url, kind: 'broken', status, contentType };
      }

      if (this.hasUntrustedRedirectTarget(url, response)) {
        return {
          url,
          kind: 'broken',
          status,
          contentType,
          error: 'redirected to untrusted host',
        };
      }

      if (hasEmptyContent(response.headers)) {
        return {
          url,
          kind: 'broken',
          status,
          contentType,
          error: 'empty response body',
        };
      }

      const kind = classifyByContentType(contentType);
      return { url, kind, status, contentType };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.debug(`HEAD validation failed for ${url}: ${message}`);
      return { url, kind: 'unknown', error: message };
    }
  }

  private async tryRangeGet(
    url: string,
    options: MediaUrlValidatorOptions,
  ): Promise<MediaValidationResult> {
    const { timeoutMs = 3000, maxRedirects = 3 } = options;
    try {
      const response = await this.requestWithUserAgentFallback('get', url, {
        timeoutMs,
        maxRedirects,
        responseType: 'arraybuffer',
        headers: { Range: 'bytes=0-1023' },
      });

      const contentType = extractContentType(response.headers);
      const status = response.status;

      if (status >= 400) {
        return { url, kind: 'broken', status, contentType };
      }

      if (this.hasUntrustedRedirectTarget(url, response)) {
        return {
          url,
          kind: 'broken',
          status,
          contentType,
          error: 'redirected to untrusted host',
        };
      }

      if (hasEmptyContent(response.headers)) {
        return {
          url,
          kind: 'broken',
          status,
          contentType,
          error: 'empty response body',
        };
      }

      let kind = classifyByContentType(contentType);
      if (kind === 'unknown' || kind === 'html') {
        const buffer = toBuffer(response.data);
        if (buffer) kind = classifyByMagicBytes(buffer);
      }

      return { url, kind, status, contentType };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.debug(`Range GET validation failed for ${url}: ${message}`);
      return { url, kind: 'unknown', error: message };
    }
  }

  /**
   * Send a HEAD/GET with the default user agent, retrying once with a
   * browser user agent when the server answers 403.
   */
  private async requestWithUserAgentFallback(
    method: 'head' | 'get',
    url: string,
    config: {
      timeoutMs: number;
      maxRedirects: number;
      responseType?: 'stream' | 'arraybuffer';
      headers?: Record<string, string>;
    },
  ): Promise<HttpResponse> {
    const send = (userAgent: string): Promise<HttpResponse> => {
      const requestConfig = {
        timeout: config.timeoutMs,
        maxRedirects: config.maxRedirects,
        validateStatus: () => true,
        headers: { ...config.headers, 'User-Agent': userAgent },
      };
      const request =
        method === 'head'
          ? this.httpService.head(url, requestConfig)
          : this.httpService.get(url, {
              ...requestConfig,
              responseType: config.responseType,
            });
      return firstValueFrom(request) as Promise<HttpResponse>;
    };

    let response = await send(HARNESS_USER_AGENT);
    if (response.status === 403) {
      this.destroyResponseStream(response);
      response = await send(BROWSER_USER_AGENT);
    }
    return response;
  }

  private destroyResponseStream(response: HttpResponse): void {
    const stream = response.data as
      (NodeJS.ReadableStream & { destroy?: () => void }) | undefined;
    stream?.destroy?.();
  }

  /**
   * After redirects, the final URL must still be a public http(s) address on
   * a non-blocklisted host. Reads the final URL from the Node http adapter
   * (`request.res.responseUrl`, populated by follow-redirects).
   */
  private hasUntrustedRedirectTarget(
    originalUrl: string,
    response: HttpResponse,
  ): boolean {
    const finalUrl = response.request?.res?.responseUrl;
    if (typeof finalUrl !== 'string' || !finalUrl || finalUrl === originalUrl)
      return false;

    try {
      const parsed = new URL(finalUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
        return true;
      const hostname = parsed.hostname.toLowerCase();
      return (
        isPrivateOrLocalhost(hostname) ||
        BLOCKED_URL_HOSTS.has(hostname) ||
        BLOCKED_IMAGE_HOSTS.has(hostname)
      );
    } catch {
      return true;
    }
  }
}
