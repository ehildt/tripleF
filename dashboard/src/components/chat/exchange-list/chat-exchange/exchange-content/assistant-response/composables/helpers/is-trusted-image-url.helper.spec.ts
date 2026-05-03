import { describe, expect, it } from 'vitest';

import { isTrustedImageUrl } from './is-trusted-image-url.helper';

describe('isTrustedImageUrl', () => {
  it('allows relative storage URLs', () => {
    expect(isTrustedImageUrl('/api/v1/storage/req-1/0')).toBe(true);
    expect(isTrustedImageUrl('/images/hero.png')).toBe(true);
  });

  it('allows self-contained data URIs', () => {
    expect(isTrustedImageUrl('data:image/png;base64,abc123')).toBe(true);
    expect(isTrustedImageUrl('data:image/webp;base64,abc123')).toBe(true);
  });

  it('allows direct image file URLs from public hosts', () => {
    expect(isTrustedImageUrl('https://example.com/images/hero.jpg')).toBe(true);
    expect(
      isTrustedImageUrl('https://news.example.com/photo.webp?size=large'),
    ).toBe(true);
    expect(isTrustedImageUrl('https://cdn.site.org/asset.png')).toBe(true);
  });

  it('allows known trusted image hosts even without file extension', () => {
    expect(isTrustedImageUrl('https://i.imgur.com/abc123')).toBe(true);
    expect(
      isTrustedImageUrl(
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/2/3/example',
      ),
    ).toBe(true);
    expect(isTrustedImageUrl('https://images.unsplash.com/photo-123')).toBe(
      true,
    );
  });

  it('rejects Google thumbnail proxies', () => {
    expect(
      isTrustedImageUrl(
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRi_gVgyafnPN8WIv4klhnZ1EEUncUQmvROBPAYf_50n9he4dpK8sLNA9c&usqp=CAI',
      ),
    ).toBe(false);
    expect(
      isTrustedImageUrl(
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaM3gHelAVzTqaCbfFsh03K6esoOW4PvFABV_lmer6iEZFDpVZ1ZptA8U&usqp=CAI&s',
      ),
    ).toBe(false);
    expect(
      isTrustedImageUrl(
        'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcExample',
      ),
    ).toBe(false);
    expect(
      isTrustedImageUrl('https://t0.gstatic.com/images?q=tbn:Example'),
    ).toBe(false);
    expect(isTrustedImageUrl('https://news.gstatic.com/image.png')).toBe(false);
  });

  it('rejects localhost and private IP addresses', () => {
    expect(isTrustedImageUrl('https://localhost/image.jpg')).toBe(false);
    expect(isTrustedImageUrl('https://127.0.0.1/image.jpg')).toBe(false);
    expect(isTrustedImageUrl('https://192.168.1.1/image.jpg')).toBe(false);
    expect(isTrustedImageUrl('https://10.0.0.1/image.jpg')).toBe(false);
  });

  it('rejects non-HTTP protocols except image data URIs', () => {
    expect(isTrustedImageUrl('data:image/png;base64,abc123')).toBe(true);
    expect(isTrustedImageUrl('ftp://example.com/image.jpg')).toBe(false);
    expect(isTrustedImageUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects URLs without image extension from unknown hosts', () => {
    expect(
      isTrustedImageUrl('https://unknown-site.com/article-image?id=123'),
    ).toBe(false);
    expect(isTrustedImageUrl('https://bad.actor.com/view?img=1')).toBe(false);
  });

  it('rejects empty or invalid URLs', () => {
    expect(isTrustedImageUrl('')).toBe(false);
    expect(isTrustedImageUrl('not-a-url')).toBe(false);
  });
});
