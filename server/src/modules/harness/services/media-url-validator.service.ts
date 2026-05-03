import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { isEmbeddableVideoUrl } from '../helpers/is-embeddable-video-url.helper.js';

export type MediaUrlKind = 'image' | 'video' | 'html' | 'broken' | 'unknown';

export interface MediaValidationResult {
  url: string;
  kind: MediaUrlKind;
  status?: number;
  contentType?: string;
  error?: string;
}

export interface MediaUrlValidatorOptions {
  enabled?: boolean;
  timeoutMs?: number;
  maxRedirects?: number;
  concurrency?: number;
}

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
]);

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

@Injectable()
export class MediaUrlValidatorService {
  private readonly logger = new Logger(MediaUrlValidatorService.name);

  constructor(private readonly httpService: HttpService) {}

  async validateUrls(
    urls: string[],
    options: MediaUrlValidatorOptions = {},
  ): Promise<MediaValidationResult[]> {
    const {
      enabled = true,
      timeoutMs = 3000,
      maxRedirects = 3,
      concurrency = 5,
    } = options;

    if (!enabled || urls.length === 0) {
      return urls.map((url) => ({ url, kind: 'unknown' }));
    }

    const results: MediaValidationResult[] = new Array(urls.length);
    let index = 0;
    const workers: Promise<void>[] = [];

    const runNext = async (): Promise<void> => {
      const currentIndex = index++;
      if (currentIndex >= urls.length) return;

      const url = urls[currentIndex];
      results[currentIndex] = await this.validateUrl(
        url,
        timeoutMs,
        maxRedirects,
      );
      await runNext();
    };

    for (let i = 0; i < Math.min(concurrency, urls.length); i++) {
      workers.push(runNext());
    }

    await Promise.all(workers);
    return results;
  }

  private async validateUrl(
    url: string,
    timeoutMs: number,
    maxRedirects: number,
  ): Promise<MediaValidationResult> {
    let headResult = await this.tryHead(url, timeoutMs, maxRedirects);

    if (
      headResult.kind === 'unknown' ||
      headResult.kind === 'html' ||
      headResult.kind === 'broken'
    ) {
      const rangeResult = await this.tryRangeGet(url, timeoutMs, maxRedirects);
      if (rangeResult.kind !== 'unknown' && rangeResult.kind !== 'broken') {
        headResult = rangeResult;
      }
    }

    if (headResult.kind === 'html' && isEmbeddableVideoUrl(url)) {
      const oEmbedResult = await this.tryYouTubeOembed(url, timeoutMs);
      if (oEmbedResult) return oEmbedResult;
      return { ...headResult, kind: 'video' };
    }

    return headResult;
  }

  private async tryYouTubeOembed(
    url: string,
    timeoutMs: number,
  ): Promise<MediaValidationResult | undefined> {
    if (!YOUTUBE_HOSTS.has(new URL(url).hostname.toLowerCase()))
      return undefined;

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
          {
            timeout: timeoutMs,
            maxRedirects: 2,
            validateStatus: () => true,
            headers: {
              'User-Agent': 'ckir-harness/1.0',
            },
          },
        ),
      );

      if (response.status === 200 && response.data?.type === 'video') {
        return { url, kind: 'video', status: response.status };
      }

      return { url, kind: 'broken', status: response.status };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.debug(
        `YouTube oEmbed validation failed for ${url}: ${message}`,
      );
      return undefined;
    }
  }

  private async tryHead(
    url: string,
    timeoutMs: number,
    maxRedirects: number,
  ): Promise<MediaValidationResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.head(url, {
          timeout: timeoutMs,
          maxRedirects,
          validateStatus: () => true,
          headers: {
            'User-Agent': 'ckir-harness/1.0',
          },
        }),
      );

      const contentType = this.extractContentType(response.headers);
      const status = response.status;

      if (status >= 400) {
        return { url, kind: 'broken', status, contentType };
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
    timeoutMs: number,
    maxRedirects: number,
  ): Promise<MediaValidationResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: timeoutMs,
          maxRedirects,
          validateStatus: () => true,
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'ckir-harness/1.0',
            Range: 'bytes=0-1023',
          },
        }),
      );

      const contentType = this.extractContentType(response.headers);
      const status = response.status;

      if (status >= 400) {
        return { url, kind: 'broken', status, contentType };
      }

      let kind = this.classifyByContentType(contentType);
      if (kind === 'unknown' || kind === 'html') {
        if (response.data) {
          kind = this.classifyByMagicBytes(Buffer.from(response.data));
        }
      }

      return { url, kind, status, contentType };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.debug(`Range GET validation failed for ${url}: ${message}`);
      return { url, kind: 'unknown', error: message };
    }
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

    // MP4 containers start with a 4-byte size then "ftyp" at offset 4.
    if (
      buffer.length >= 8 &&
      buffer[4] === 0x66 &&
      buffer[5] === 0x74 &&
      buffer[6] === 0x79 &&
      buffer[7] === 0x70
    ) {
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
