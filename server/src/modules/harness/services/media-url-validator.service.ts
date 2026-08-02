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

type MediaUrlKind = 'image' | 'video' | 'html' | 'broken' | 'unknown';

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

const IMAGE_CONTENT_TYPE_PREFIXES = ['image/'];
const VIDEO_CONTENT_TYPE_PREFIXES = [
  'video/',
  'application/x-mpegurl',
  'application/vnd.apple.mpegurl',
];
const HTML_CONTENT_TYPE_PREFIXES = ['text/html', 'application/xhtml'];

const IMAGE_MAGIC_BYTES: Array<{ bytes: number[]; mime: string }> = [
  { bytes: [0xff, 0xd8, 0xff], mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: 'image/png' },
  { bytes: [0x47, 0x49, 0x46, 0x38], mime: 'image/gif' },
];

const VIDEO_MAGIC_BYTES: Array<{ bytes: number[]; mime: string }> = [
  { bytes: [0x00, 0x00, 0x00], mime: 'video/mp4' },
  { bytes: [0x1a, 0x45, 0xdf, 0xa3], mime: 'video/webm' },
  { bytes: [0x4f, 0x67, 0x67, 0x53], mime: 'video/ogg' },
];

/**
 * ISOBMFF major brands (the 4 letters after "ftyp") that identify image
 * containers rather than video: AVIF and the HEIF family.
 */
const ISOBMFF_IMAGE_BRANDS = new Set([
  'avif',
  'avis',
  'heic',
  'heix',
  'hevc',
  'hevx',
  'heim',
  'heis',
  'hevm',
  'hevs',
  'mif1',
  'msf1',
]);

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
        this.isImageContentType(headResult.contentType))
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

      const contentType = this.extractContentType(response.headers);
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

  private isImageContentType(contentType?: string): boolean {
    if (!contentType) return false;
    return IMAGE_CONTENT_TYPE_PREFIXES.some((p) =>
      contentType.toLowerCase().startsWith(p),
    );
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

      const contentType = this.extractContentType(response.headers);
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

      if (this.hasEmptyContent(response.headers)) {
        return {
          url,
          kind: 'broken',
          status,
          contentType,
          error: 'empty response body',
        };
      }

      const kind = this.classifyByContentType(contentType);
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

      const contentType = this.extractContentType(response.headers);
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

      if (this.hasEmptyContent(response.headers)) {
        return {
          url,
          kind: 'broken',
          status,
          contentType,
          error: 'empty response body',
        };
      }

      let kind = this.classifyByContentType(contentType);
      if (kind === 'unknown' || kind === 'html') {
        const buffer = this.toBuffer(response.data);
        if (buffer) kind = this.classifyByMagicBytes(buffer);
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

  /** A zero content-length on a 2xx response means there is nothing to show. */
  private hasEmptyContent(headers: Record<string, unknown>): boolean {
    const raw = headers['content-length'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    return Number(value) === 0;
  }

  private toBuffer(data: unknown): Buffer | undefined {
    if (Buffer.isBuffer(data)) return data;
    if (data instanceof ArrayBuffer) return Buffer.from(data);
    if (ArrayBuffer.isView(data)) {
      return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    }
    if (typeof data === 'string') return Buffer.from(data);
    return undefined;
  }

  private extractContentType(
    headers: Record<string, unknown>,
  ): string | undefined {
    const value = headers['content-type'];
    if (typeof value === 'string')
      return value.split(';')[0].trim().toLowerCase();
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === 'string'
    ) {
      return value[0].split(';')[0].trim().toLowerCase();
    }
    return undefined;
  }

  private classifyByContentType(contentType?: string): MediaUrlKind {
    if (!contentType) return 'unknown';

    if (IMAGE_CONTENT_TYPE_PREFIXES.some((p) => contentType.startsWith(p)))
      return 'image';
    if (VIDEO_CONTENT_TYPE_PREFIXES.some((p) => contentType.startsWith(p)))
      return 'video';
    if (HTML_CONTENT_TYPE_PREFIXES.some((p) => contentType.startsWith(p)))
      return 'html';

    return 'unknown';
  }

  private classifyByMagicBytes(buffer: Buffer): MediaUrlKind {
    // WebP is a RIFF container with "WEBP" at bytes 8-11.
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image';
    }

    // ISOBMFF containers start with a 4-byte size then "ftyp" at offset 4.
    // The major brand at offset 8 distinguishes videos (mp4, isom, …) from
    // AVIF/HEIF images, which share the same container format.
    if (
      buffer.length >= 8 &&
      buffer[4] === 0x66 &&
      buffer[5] === 0x74 &&
      buffer[6] === 0x79 &&
      buffer[7] === 0x70
    ) {
      if (buffer.length >= 12) {
        const brand = buffer.toString('ascii', 8, 12);
        if (ISOBMFF_IMAGE_BRANDS.has(brand)) return 'image';
      }
      return 'video';
    }

    for (const signature of IMAGE_MAGIC_BYTES) {
      if (this.bufferStartsWith(buffer, signature.bytes)) return 'image';
    }
    for (const signature of VIDEO_MAGIC_BYTES) {
      if (this.bufferStartsWith(buffer, signature.bytes)) return 'video';
    }
    return 'unknown';
  }

  private bufferStartsWith(buffer: Buffer, bytes: number[]): boolean {
    if (buffer.length < bytes.length) return false;
    for (let i = 0; i < bytes.length; i++) {
      if (buffer[i] !== bytes[i]) return false;
    }
    return true;
  }
}
