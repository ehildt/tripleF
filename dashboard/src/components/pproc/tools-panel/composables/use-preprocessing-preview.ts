import { ref } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { useLightbox } from '@/components/shared/ui/lightbox/composables/use-lightbox';
import { useToast } from '@/composables/use-toast';
import { usePreprocessingStore } from '@/stores/preprocessing';

/** One preprocessing variant returned by the preview endpoint. */
interface SharpPreviewVariant {
  variant: string;
  name: string;
  description: string;
  dataUrl: string;
}

/**
 * Preprocessing preview flow: the user picks an image once, it is sent to
 * the server's sharp pipeline immediately, and the resulting variants open
 * in the shared lightbox. The picked file is kept in memory so later
 * previews (after tweaking settings) reuse it; the lightbox header offers
 * a repick action to dismiss it and choose a new image.
 */
export function usePreprocessingPreview() {
  const store = usePreprocessingStore();
  const toast = useToast();
  const lightbox = useLightbox();

  const previewFile = ref<File | null>(null);
  const isPreviewLoading = ref(false);
  const fileInput = ref<HTMLInputElement | null>(null);

  function openPicker() {
    fileInput.value?.click();
  }

  async function sendPreview() {
    if (!previewFile.value || isPreviewLoading.value) return;
    isPreviewLoading.value = true;
    try {
      // The settings push is debounced — flush it so the preview runs
      // against the very latest knobs.
      store.pushSettingsToServer();
      const formData = new FormData();
      formData.append('images', previewFile.value);
      const res = await fetch(getApiUrl('/api/v1/sharp-overrides/preview'), {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      const variants = (await res.json()) as SharpPreviewVariant[];
      if (variants.length === 0) throw new Error('no variants returned');
      const images = variants.map((v) => ({
        url: v.dataUrl,
        title: `${v.variant} — ${v.description}`,
      }));
      lightbox.openImages(images, images[0].url);
    } catch (e) {
      toast.error(
        `Preview failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      isPreviewLoading.value = false;
    }
  }

  function onFilePicked(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Reset so picking the same file twice still fires change.
    input.value = '';
    if (!file) return;
    previewFile.value = file;
    sendPreview();
  }

  /** First click picks an image; later clicks reuse it. */
  function onPreviewClick() {
    if (previewFile.value) sendPreview();
    else openPicker();
  }

  /** Dismiss the current image and pick a new one. */
  function repickImage() {
    previewFile.value = null;
    lightbox.close();
    openPicker();
  }

  return {
    fileInput,
    isPreviewLoading,
    lightbox,
    onFilePicked,
    onPreviewClick,
    repickImage,
  };
}
