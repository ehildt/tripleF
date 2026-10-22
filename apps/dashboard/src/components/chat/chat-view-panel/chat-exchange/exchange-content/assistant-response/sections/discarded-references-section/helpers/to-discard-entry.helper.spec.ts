import { describe, expect, it } from 'vitest';

import { toDiscardEntry } from './to-discard-entry.helper';

describe('toDiscardEntry', () => {
  it('returns undefined for malformed input', () => {
    expect(toDiscardEntry(undefined as never)).toBeUndefined();
  });

  it('renders an image entry as a thumbnail with an encoded URL', () => {
    expect(
      toDiscardEntry({
        type: 'image',
        imageUrl: '/storage/my image.jpg',
        title: 'Pic',
        reason: 'blurry',
      }),
    ).toEqual({
      thumbUrl: '/storage/my%20image.jpg',
      label: 'Pic',
      reason: 'blurry',
    });
  });

  it('falls back to the URL as label when no title is present', () => {
    expect(
      toDiscardEntry({ type: 'image', imageUrl: '/storage/a.jpg' })?.label,
    ).toBe('/storage/a.jpg');
    expect(
      toDiscardEntry({ type: 'link', url: 'https://example.com' })?.label,
    ).toBe('https://example.com');
  });

  it('renders a link entry', () => {
    const entry = toDiscardEntry({
      type: 'link',
      url: 'https://example.com',
      title: 'Page',
    });
    expect(entry?.href).toBe('https://example.com');
    expect(entry?.thumbUrl).toBeUndefined();
  });

  it('returns undefined for entries without a URL', () => {
    expect(toDiscardEntry({ type: 'image', imageUrl: '' })).toBeUndefined();
    expect(toDiscardEntry({ type: 'link', url: '' })).toBeUndefined();
  });

  it('defaults a missing reason to an empty reason', () => {
    expect(toDiscardEntry({ type: 'image', imageUrl: '/a.jpg' })?.reason).toBe(
      '',
    );
  });
});
