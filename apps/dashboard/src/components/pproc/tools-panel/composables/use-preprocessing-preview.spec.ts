import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { usePreprocessingPreview } from './use-preprocessing-preview';

const mocks = vi.hoisted(() => ({
  flushSettings: vi.fn(),
  preview: vi.fn(),
  debugToast: vi.fn(),
  errorToast: vi.fn(),
}));

vi.mock('@/api/preview-sharp-overrides.api', () => ({
  previewSharpOverrides: mocks.preview,
}));
vi.mock(
  '@/composables/use-preprocessing-settings-sync/use-preprocessing-settings-sync',
  () => ({
    usePreprocessingSettingsSync: () => ({
      loadSettings: vi.fn(),
      flushSettings: mocks.flushSettings,
    }),
  }),
);
vi.mock('@/composables/use-toast/use-toast', () => ({
  useToast: () => ({
    debug: mocks.debugToast,
    error: mocks.errorToast,
  }),
}));

const variant = {
  variant: 'grayscale',
  name: 'image.png',
  description: 'Grayscale',
  dataUrl: 'data:image/png;base64,abc',
};

function deferred() {
  let resolve = () => {};
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function mountPreview() {
  let preview!: ReturnType<typeof usePreprocessingPreview>;
  const wrapper = mount(
    defineComponent({
      setup() {
        preview = usePreprocessingPreview();
        return () => h('input', { ref: 'fileInput', type: 'file' });
      },
    }),
  );
  const input = wrapper.get('input').element as HTMLInputElement;
  return { preview, input };
}

function pickFile(
  preview: ReturnType<typeof usePreprocessingPreview>,
  input: HTMLInputElement,
): File {
  const file = new File(['image'], 'image.png', { type: 'image/png' });
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  preview.onFilePicked({ target: input } as unknown as Event);
  return file;
}

describe('usePreprocessingPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.flushSettings.mockResolvedValue(undefined);
    mocks.preview.mockResolvedValue([variant]);
  });

  it('opens the picker when no image has been selected', () => {
    const { preview, input } = mountPreview();
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});

    preview.onPreviewClick();

    expect(click).toHaveBeenCalledOnce();
    expect(mocks.flushSettings).not.toHaveBeenCalled();
  });

  it('waits for settings flushing before uploading and opens validated variants', async () => {
    const flush = deferred();
    mocks.flushSettings.mockReturnValue(flush.promise);
    const { preview, input } = mountPreview();

    const file = pickFile(preview, input);
    expect(preview.isPreviewLoading.value).toBe(true);
    expect(mocks.preview).not.toHaveBeenCalled();

    flush.resolve();
    await flushPromises();

    expect(mocks.preview).toHaveBeenCalledWith(file);
    expect(mocks.preview.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.flushSettings.mock.invocationCallOrder[0],
    );
    expect(preview.lightbox.isOpen.value).toBe(true);
    expect(preview.lightbox.images.value).toEqual([
      { url: variant.dataUrl, title: 'grayscale — Grayscale' },
    ]);
    expect(preview.isPreviewLoading.value).toBe(false);
  });

  it('reuses the selected file and flushes again on the next preview', async () => {
    const { preview, input } = mountPreview();
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});
    const file = pickFile(preview, input);
    await flushPromises();

    preview.onPreviewClick();
    await flushPromises();

    expect(click).not.toHaveBeenCalled();
    expect(mocks.flushSettings).toHaveBeenCalledTimes(2);
    expect(mocks.preview).toHaveBeenNthCalledWith(2, file);
  });

  it('does not upload when the latest global settings cannot be saved', async () => {
    mocks.flushSettings.mockRejectedValue(new Error('save failed'));
    const { preview, input } = mountPreview();

    pickFile(preview, input);
    await flushPromises();

    expect(mocks.preview).not.toHaveBeenCalled();
    expect(mocks.debugToast).toHaveBeenCalledWith('save failed');
    expect(mocks.errorToast).toHaveBeenCalledWith(
      "Couldn't generate the preview",
    );
    expect(preview.lightbox.isOpen.value).toBe(false);
    expect(preview.isPreviewLoading.value).toBe(false);
  });

  it.each([
    ['malformed', {}],
    ['empty', []],
  ])(
    'uses the existing failure path for %s responses',
    async (_label, payload) => {
      mocks.preview.mockResolvedValue(payload);
      const { preview, input } = mountPreview();

      pickFile(preview, input);
      await flushPromises();

      expect(preview.lightbox.isOpen.value).toBe(false);
      expect(mocks.errorToast).toHaveBeenCalledWith(
        "Couldn't generate the preview",
      );
    },
  );

  it('repicks by closing the lightbox and opening the picker', async () => {
    const { preview, input } = mountPreview();
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});
    pickFile(preview, input);
    await flushPromises();
    expect(preview.lightbox.isOpen.value).toBe(true);

    preview.repickImage();

    expect(preview.lightbox.isOpen.value).toBe(false);
    expect(click).toHaveBeenCalledOnce();
  });
});
