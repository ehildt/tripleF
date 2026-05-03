import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';

import { useExchangeLightbox } from './use-exchange-lightbox';

interface Harness {
  isOpen: ReturnType<typeof useExchangeLightbox>['isOpen'];
  images: ReturnType<typeof useExchangeLightbox>['images'];
  index: ReturnType<typeof useExchangeLightbox>['index'];
  openImages: ReturnType<typeof useExchangeLightbox>['openImages'];
  close: ReturnType<typeof useExchangeLightbox>['close'];
  goPrev: ReturnType<typeof useExchangeLightbox>['goPrev'];
  goNext: ReturnType<typeof useExchangeLightbox>['goNext'];
  unmount: () => void;
}

function createHarness(): Harness {
  let exposed!: ReturnType<typeof useExchangeLightbox>;
  const Comp = defineComponent({
    setup() {
      exposed = useExchangeLightbox();
      return () => h('div');
    },
  });
  const app = createApp(Comp);
  const host = document.createElement('div');
  document.body.appendChild(host);
  app.mount(host);
  return {
    isOpen: exposed.isOpen,
    images: exposed.images,
    index: exposed.index,
    openImages: exposed.openImages,
    close: exposed.close,
    goPrev: exposed.goPrev,
    goNext: exposed.goNext,
    unmount: () => {
      app.unmount();
      host.remove();
    },
  };
}

describe('useExchangeLightbox', () => {
  let harness: Harness;

  beforeEach(() => {
    harness = createHarness();
  });

  afterEach(() => {
    harness.unmount();
  });

  it('starts closed with empty images', () => {
    expect(harness.isOpen.value).toBe(false);
    expect(harness.images.value).toEqual([]);
    expect(harness.index.value).toBe(0);
  });

  it('opens with images and starts at the clicked image index', () => {
    harness.openImages(['a.png', 'b.png', 'c.png'], 'b.png');
    expect(harness.isOpen.value).toBe(true);
    expect(harness.images.value).toEqual(['a.png', 'b.png', 'c.png']);
    expect(harness.index.value).toBe(1);
  });

  it('does not open when clicked src is not found', () => {
    harness.openImages(['a.png'], 'missing.png');
    expect(harness.isOpen.value).toBe(false);
  });

  it('navigates prev/next with bounds', () => {
    harness.openImages(['a.png', 'b.png', 'c.png'], 'b.png');

    harness.goPrev();
    expect(harness.index.value).toBe(0);
    harness.goPrev();
    expect(harness.index.value).toBe(0);

    harness.goNext();
    harness.goNext();
    harness.goNext();
    expect(harness.index.value).toBe(2);
  });

  it('closes the lightbox', () => {
    harness.openImages(['a.png'], 'a.png');
    expect(harness.isOpen.value).toBe(true);
    harness.close();
    expect(harness.isOpen.value).toBe(false);
  });

  it('reacts to keydown events when open', async () => {
    harness.openImages(['a.png', 'b.png'], 'a.png');
    await nextTick();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(harness.index.value).toBe(1);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(harness.index.value).toBe(0);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(harness.index.value).toBe(0);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(harness.isOpen.value).toBe(false);
  });

  it('ignores keydown events when closed', async () => {
    await nextTick();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(harness.isOpen.value).toBe(false);
  });
});
