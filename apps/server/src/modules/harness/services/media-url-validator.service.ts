import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { BLOCKED_URL_HOSTS } from '@triplef/agent/schemas';
import { isPrivateOrLocalhost } from '@triplef/agent/schemas';
import { BLOCKED_IMAGE_HOSTS } from '@triplef/agent/schemas';
import { firstValueFrom } from 'rxjs';
import sharp from 'sharp';

import {
  BROWSER_USER_AGENT,
  HARNESS_USER_AGENT,
} from '../constants/user-agents.constant.js';
import { classifyByContentType } from '../helpers/media-classification/classify-by-content-type.helper.js';
import { classifyByMagicBytes } from '../helpers/media-classification/classify-by-magic-bytes.helper.js';
import { extractContentType } from '../helpers/media-classification/extract-content-type.helper.js';
import { hasEmptyContent } from '../helpers/media-classification/has-empty-content.helper.js';
import { isImageContentType } from '../helpers/media-classification/is-image-content-type.helper.js';
import { toBuffer } from '../helpers/media-classification/to-buffer.helper.js';
import { isEmbeddableVideoUrl } from '../helpers/url-trust/is-embeddable-video-url.helper.js';
import {
  hasOembedProvider,
  OEMBED_ENDPOINTS,
  OEMBED_HOST_PROVIDERS,
} from '../helpers/url-trust/oembed-provider.helper.js';

import type {
  HttpResponse,
  MediaUrlValidatorOptions,
} from './media-url-validator.service.types.js';
import { MediaValidationCache } from './media-validation-cache.js';
import type { MediaValidationResult } from './media-validation-cache.types.js';

export type { MediaValidationResult } from './media-validation-cache.types.js';

const UNKNOWN_RETRY_DELAY_MS = 200;

@Injectable()
export class MediaUrlValidatorService {
  private readonly logger = new Logger(MediaUrlValidatorService.name);

  /**
   * Short-TTL result cache keyed by URL + dimension options. Dedupes repeated
   * probes within one sanitize pass (image URLs are collected twice) and
   * across follow-up requests in the same conversation.
   */
  private readonly validationCache = new MediaValidationCache();

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
    const cacheKeys = urls.map((url) =>
      this.validationCache.buildKey(url, options),
    );
    const pendingIndexes: number[] = [];

    for (let i = 0; i < urls.length; i++) {
      const cached = this.validationCache.read(cacheKeys[i]);
      if (cached) results[i] = cached;
      else pendingIndexes.push(i);
    }

    let cursor = 0;
    const runNext = async (): Promise<void> => {
      const current = cursor++;
      if (current >= pendingIndexes.length) return;

      const urlIndex = pendingIndexes[current];
      const result = await this.validateUrl(urls[urlIndex], options);
      this.validationCache.write(cacheKeys[urlIndex], result);
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
    // Known embeddable video pages (YouTube, Vimeo, Dailymotion, Loom, Wistia)
    // are verified through the provider's oEmbed endpoint rather than by
    // probing the watch page. Watch pages are often bot-blocked or
    // unreachable from the server (YouTube), so a page probe that times out
    // or returns HTML must not gate the video verdict — the oEmbed lookup is
    // the authoritative liveness check and would otherwise be skipped
    // whenever the page probe fails. Direct video files (no oEmbed provider)
    // fall through to the normal page probe below.
    if (isEmbeddableVideoUrl(url)) {
      const oEmbedResult = await this.tryProviderOembed(
        url,
        options.timeoutMs ?? 3000,
      );
      // oEmbed 200 -> {kind:'video'}; a definitive provider rejection
      // (404/410) -> {kind:'broken'}. When oEmbed is unreachable (provider
      // down, or the server cannot reach it) it returns undefined: for a
      // known provider page that already passed isEmbeddableVideoUrl and
      // came from a video search, a network failure is not evidence of a
      // broken video, so keep it.
      if (oEmbedResult) return oEmbedResult;
      if (hasOembedProvider(url)) return { url, kind: 'video' };
    }

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
      minWidth,
      minHeight,
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
        // undersized image in the gallery.
        return {
          url,
          kind: 'broken',
          status,
          contentType: contentType ?? preliminary.contentType,
          error: 'could not determine image dimensions',
        };
      }

      if (
        (minWidth !== undefined && metadata.width < minWidth) ||
        (minHeight !== undefined && metadata.height < minHeight)
      ) {
        return {
          url,
          kind: 'broken',
          status,
          contentType,
          error: `image dimensions ${metadata.width}x${metadata.height} below ${minWidth ?? 0}x${minHeight ?? 0}`,
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
