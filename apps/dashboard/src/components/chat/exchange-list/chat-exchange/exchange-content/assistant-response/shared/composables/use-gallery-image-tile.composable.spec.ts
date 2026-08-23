import { describe, expect, it, vi } from 'vitest';
import { provide } from 'vue';

import { runInSetup } from '@/test-utils/run-in-setup';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import { useGalleryImageTile } from './use-gallery-image-tile.composable';

describe('useGalleryImageTile', () => {
  it('encodes the image source URL', () => {
    const { src } = runInSetup(() =>
      useGalleryImageTile({ imageUrl: '/a?x=1 2' }, 'Image'),
    );

    expect(src).toBe(encodeURI('/a?x=1 2'));
  });

  it('resolves the label from alt, then title, then the fallback', () => {
    const alt = runInSetup(() =>
      useGalleryImageTile({ imageUrl: '/a', imageAlt: 'Alt' }, 'Image'),
    );
    const title = runInSetup(() =>
      useGalleryImageTile({ imageUrl: '/a', title: 'Title' }, 'Image'),
    );
    const fallback = runInSetup(() =>
      useGalleryImageTile({ imageUrl: '/a' }, 'Image'),
    );

    expect(alt.label.value).toBe('Alt');
    expect(title.label.value).toBe('Title');
    expect(fallback.label.value).toBe('Image');
  });

  it('opens the injected lightbox with the item', () => {
    const onImageClicked = vi.fn();
    const item = { imageUrl: '/a' };
    const { open } = runInSetup(
      () => useGalleryImageTile(item, 'Image'),
      () => provide(harnessImageClickedKey as symbol, onImageClicked),
    );

    open();

    expect(onImageClicked).toHaveBeenCalledWith(item);
  });

  it('is a no-op without an injected handler', () => {
    const { open } = runInSetup(() =>
      useGalleryImageTile({ imageUrl: '/a' }, 'Image'),
    );

    expect(() => open()).not.toThrow();
  });

  it('does not open the lightbox once the image failed to load', () => {
    const onImageClicked = vi.fn();
    const { open, handleImageError } = runInSetup(
      () => useGalleryImageTile({ imageUrl: '/missing' }, 'Image'),
      () => provide(harnessImageClickedKey as symbol, onImageClicked),
    );

    handleImageError();
    open();

    expect(onImageClicked).not.toHaveBeenCalled();
  });
});
