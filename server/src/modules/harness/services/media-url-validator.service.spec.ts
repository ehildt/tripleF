import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MediaUrlValidatorService,
  type MediaValidationResult,
} from './media-url-validator.service.js';

describe('MediaUrlValidatorService', () => {
  let service: MediaUrlValidatorService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaUrlValidatorService,
        {
          provide: HttpService,
          useValue: {
            head: vi.fn(),
            get: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MediaUrlValidatorService>(MediaUrlValidatorService);
    httpService = module.get<HttpService>(HttpService);
  });

  function headResponse(status: number, contentType?: string) {
    return of({
      status,
      statusText: 'OK',
      headers: contentType ? { 'content-type': contentType } : {},
      data: undefined,
      config: {},
    }) as never;
  }

  it('marks a working image URL as image', async () => {
    vi.mocked(httpService.head).mockReturnValue(
      headResponse(200, 'image/jpeg'),
    );

    const results = await service.validateUrls([
      'https://example.com/image.jpg',
    ]);

    expect(results[0]).toEqual<MediaValidationResult>({
      url: 'https://example.com/image.jpg',
      kind: 'image',
      status: 200,
      contentType: 'image/jpeg',
    });
  });

  it('marks a 404 as broken', async () => {
    vi.mocked(httpService.head).mockReturnValue(headResponse(404));

    const results = await service.validateUrls([
      'https://example.com/missing.jpg',
    ]);

    expect(results[0].kind).toBe('broken');
    expect(results[0].status).toBe(404);
  });

  function rangeResponse(
    status: number,
    headers: Record<string, string>,
    data?: Buffer,
  ) {
    return of({
      status,
      statusText: 'OK',
      headers,
      data,
      config: {},
    }) as never;
  }

  it('falls back to range GET when HEAD returns HTML', async () => {
    vi.mocked(httpService.head).mockReturnValue(
      headResponse(200, 'text/html; charset=utf-8'),
    );
    vi.mocked(httpService.get).mockReturnValue(
      rangeResponse(
        200,
        { 'content-type': 'image/png' },
        Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      ),
    );

    const results = await service.validateUrls([
      'https://example.com/image.png',
    ]);

    expect(results[0]).toEqual<MediaValidationResult>({
      url: 'https://example.com/image.png',
      kind: 'image',
      status: 200,
      contentType: 'image/png',
    });
  });

  it('detects video by magic bytes when Content-Type is missing', async () => {
    vi.mocked(httpService.head).mockReturnValue(
      headResponse(405, 'text/html') as never,
    );
    vi.mocked(httpService.get).mockReturnValue(
      rangeResponse(
        206,
        {},
        Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]),
      ),
    );

    const results = await service.validateUrls([
      'https://example.com/video.mp4',
    ]);

    expect(results[0].kind).toBe('video');
  });

  it('detects WebP images by magic bytes', async () => {
    // RIFF....WEBP header
    const webp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x26, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x20,
    ]);
    vi.mocked(httpService.head).mockReturnValue(
      headResponse(405, 'text/html') as never,
    );
    vi.mocked(httpService.get).mockReturnValue(rangeResponse(206, {}, webp));

    const results = await service.validateUrls([
      'https://example.com/image.webp',
    ]);

    expect(results[0].kind).toBe('image');
  });

  it('does not classify generic RIFF containers as WebP', async () => {
    const riff = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x20,
    ]);
    vi.mocked(httpService.head).mockImplementation(() => {
      throw new Error('timeout');
    });
    vi.mocked(httpService.get).mockReturnValue(rangeResponse(206, {}, riff));

    const results = await service.validateUrls([
      'https://example.com/video.avi',
    ]);

    expect(results[0].kind).toBe('unknown');
  });

  it('classifies HLS playlists as video', async () => {
    vi.mocked(httpService.head).mockReturnValue(
      headResponse(200, 'application/vnd.apple.mpegurl'),
    );

    const results = await service.validateUrls([
      'https://example.com/playlist.m3u8',
    ]);

    expect(results[0]).toEqual<MediaValidationResult>({
      url: 'https://example.com/playlist.m3u8',
      kind: 'video',
      status: 200,
      contentType: 'application/vnd.apple.mpegurl',
    });
  });

  it('treats embeddable video platform HTML as video', async () => {
    vi.mocked(httpService.head).mockReturnValue(headResponse(200, 'text/html'));
    vi.mocked(httpService.get).mockReturnValue(
      of({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { type: 'video', title: 'Example' },
        config: {},
      }) as never,
    );

    const results = await service.validateUrls([
      'https://www.youtube.com/watch?v=abc123',
    ]);

    expect(results[0].kind).toBe('video');
  });

  it('keeps an embeddable provider video when the page probe times out (oEmbed reachable)', async () => {
    // Page probes fail (timeout), but the provider oEmbed endpoint confirms
    // the video exists — it must not be dropped for an unreachable watch page.
    vi.mocked(httpService.head).mockImplementation(() => {
      throw new Error('timeout');
    });
    vi.mocked(httpService.get).mockReturnValue(
      of({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { type: 'video', title: 'Example' },
        config: {},
      }) as never,
    );

    const results = await service.validateUrls([
      'https://www.youtube.com/watch?v=abc123',
    ]);

    expect(results[0].kind).toBe('video');
  });

  it('keeps an embeddable provider video when oEmbed is unreachable too (network failure)', async () => {
    vi.mocked(httpService.head).mockImplementation(() => {
      throw new Error('timeout');
    });
    vi.mocked(httpService.get).mockImplementation(() => {
      throw new Error('timeout');
    });

    const results = await service.validateUrls([
      'https://www.youtube.com/watch?v=abc123',
    ]);

    // A vetted embeddable URL must not be dropped on a network failure.
    expect(results[0].kind).toBe('video');
  });

  it('still routes direct video files through the page probe', async () => {
    // Direct files have no oEmbed provider, so the content-type/status from
    // the probe is honored rather than a blanket keep.
    vi.mocked(httpService.head).mockReturnValue(headResponse(200, 'video/mp4'));

    const results = await service.validateUrls([
      'https://example.com/video.mp4',
    ]);

    expect(results[0]).toMatchObject({ kind: 'video', status: 200 });
  });

  it('marks broken YouTube oEmbed responses as broken', async () => {
    vi.mocked(httpService.head).mockReturnValue(headResponse(200, 'text/html'));
    vi.mocked(httpService.get).mockReturnValue(
      of({
        status: 404,
        statusText: 'Not Found',
        headers: {},
        data: 'Not Found',
        config: {},
      }) as never,
    );

    const results = await service.validateUrls([
      'https://www.youtube.com/watch?v=nonexistent12345',
    ]);

    expect(results[0].kind).toBe('broken');
    expect(results[0].status).toBe(404);
  });

  it('marks unauthorized YouTube oEmbed responses as broken', async () => {
    vi.mocked(httpService.head).mockReturnValue(headResponse(200, 'text/html'));
    vi.mocked(httpService.get).mockReturnValue(
      of({
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        data: 'Unauthorized',
        config: {},
      }) as never,
    );

    const results = await service.validateUrls([
      'https://www.youtube.com/watch?v=private12345',
    ]);

    expect(results[0].kind).toBe('broken');
    expect(results[0].status).toBe(401);
  });

  it('returns unknown when disabled', async () => {
    const results = await service.validateUrls(
      ['https://example.com/image.jpg'],
      { enabled: false },
    );

    expect(results[0]).toEqual<MediaValidationResult>({
      url: 'https://example.com/image.jpg',
      kind: 'unknown',
    });
    expect(httpService.head).not.toHaveBeenCalled();
  });

  it('returns unknown when all checks fail', async () => {
    vi.mocked(httpService.head).mockImplementation(() => {
      throw new Error('timeout');
    });
    vi.mocked(httpService.get).mockImplementation(() => {
      throw new Error('timeout');
    });

    const results = await service.validateUrls([
      'https://example.com/slow.jpg',
    ]);

    expect(results[0].kind).toBe('unknown');
    expect(results[0].error).toBe('timeout');
  });
});
