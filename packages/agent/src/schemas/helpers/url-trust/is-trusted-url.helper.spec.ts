import { describe, expect, it } from 'vitest';

import { isTrustedUrl } from './is-trusted-url.helper.js';

describe('isTrustedUrl', () => {
  it('accepts real article URLs', () => {
    expect(isTrustedUrl('https://example.com/article')).toBe(true);
    expect(isTrustedUrl('https://www.bbc.com/news/123456')).toBe(true);
  });

  it('rejects YouTube JS asset URLs', () => {
    expect(
      isTrustedUrl(
        'https://www.youtube.com/s/_/ytembeds/_/js/k=ytembeds.base.en_US.DmLPwS-QVfI.2021.O/am=AAAAgA/d=1/br=1/rs=AGKMywEZpz2uK0zwYjoH08xuduL1PiQtSQ/m=root,base',
      ),
    ).toBe(false);
    expect(isTrustedUrl('https://www.youtube.com/static/js/foo.js')).toBe(false);
    expect(isTrustedUrl('https://www.youtube.com/api/stats')).toBe(false);
  });

  it('accepts YouTube video URLs', () => {
    expect(isTrustedUrl('https://www.youtube.com/watch?v=abc123')).toBe(true);
    expect(isTrustedUrl('https://youtu.be/abc123')).toBe(true);
  });

  it('rejects static asset URLs', () => {
    expect(isTrustedUrl('https://example.com/app.js')).toBe(false);
    expect(isTrustedUrl('https://example.com/styles.css')).toBe(false);
    expect(isTrustedUrl('https://example.com/icon.svg')).toBe(false);
    expect(isTrustedUrl('https://example.com/photo.png')).toBe(false);
    expect(isTrustedUrl('https://example.com/video.mp4')).toBe(false);
    expect(isTrustedUrl('https://example.com/doc.pdf')).toBe(false);
  });

  it('rejects non-HTTP schemes', () => {
    expect(isTrustedUrl('javascript:alert(1)')).toBe(false);
    expect(isTrustedUrl('data:text/html,<script>')).toBe(false);
    expect(isTrustedUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects Google thumbnail proxies', () => {
    expect(isTrustedUrl('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcExample')).toBe(false);
    expect(isTrustedUrl('https://t0.gstatic.com/images?q=tbn:Example')).toBe(false);
  });

  it('rejects private IP / localhost URLs by default', () => {
    expect(isTrustedUrl('https://localhost/article')).toBe(false);
    expect(isTrustedUrl('https://127.0.0.1/article')).toBe(false);
    expect(isTrustedUrl('https://192.168.1.1/article')).toBe(false);
    expect(isTrustedUrl('http://10.0.0.1/article')).toBe(false);
  });

  it('allows private IP / localhost URLs when explicitly allowed', () => {
    expect(isTrustedUrl('https://localhost/article', { allowPrivate: true })).toBe(true);
  });

  it('rejects empty or invalid URLs', () => {
    expect(isTrustedUrl('')).toBe(false);
    expect(isTrustedUrl('not-a-url')).toBe(false);
  });
});
