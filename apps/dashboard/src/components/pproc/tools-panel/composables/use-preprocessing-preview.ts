import { ref, useTemplateRef } from 'vue';

import { previewSharpOverrides } from '@/api/preview-sharp-overrides.api';
import { useLightbox } from '@/components/shared/ui/lightbox/composables/use-lightbox';
import { usePreprocessingSettingsSync } from '@/composables/use-preprocessing-settings-sync/use-preprocessing-settings-sync';
import { useToast } from '@/composables/use-toast/use-toast';
import { i18n } from '@/i18n/i18n';

import { mapPreviewVariant } from './helpers/map-preview-variant.helper';
import { parseSharpPreviewVariants } from './helpers/parse-sharp-preview-variants.helper';
import type { PreprocessingPreview } from './use-preprocessing-preview.types';

/**
 * Pick or reuse an image, flush current preprocessing settings, and open the
 * validated server-generated variants in the shared lightbox.
 */

export function usePreprocessingPreview(): PreprocessingPreview {
  const settingsSync = usePreprocessingSettingsSync();
  const toast = useToast();
  const lightbox = useLightbox();

  const previewFile = ref<File | null>(null);
  const isPreviewLoading = ref(false);
  const fileInput = useTemplateRef<HTMLInputElement>('fileInput');

  function openPicker(): void {
    fileInput.value?.click();
  }

  async function sendPreview(): Promise<void> {
    const image = previewFile.value;
    if (!image || isPreviewLoading.value) return;
    isPreviewLoading.value = true;
    try {
      // Preview reads the server's global overrides, so the latest local
      // snapshot must finish saving before the image is uploaded.
      await settingsSync.flushSettings();
      const payload = await previewSharpOverrides(image);
      const variants = parseSharpPreviewVariants(payload);
      if (variants.length === 0) throw new Error('no variants returned');
      const images = variants.map(mapPreviewVariant);
      lightbox.openImages(images, images[0].url);
    } catch (e) {
      toast.debug(e instanceof Error ? e.message : String(e));
      toast.error(i18n.global.t('toast.previewFailed'));
    } finally {
      isPreviewLoading.value = false;
    }
  }

  function onFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Reset so picking the same file twice still fires change.
    input.value = '';
    if (!file) return;
    previewFile.value = file;
    void sendPreview();
  }

  /** First click picks an image; later clicks reuse it. */
  function onPreviewClick(): void {
    if (previewFile.value) void sendPreview();
    else openPicker();
  }

  /** Dismiss the current image and pick a new one. */
  function repickImage(): void {
    previewFile.value = null;
    lightbox.close();
    openPicker();
  }

  return {
    isPreviewLoading,
    lightbox,
    onFilePicked,
    onPreviewClick,
    repickImage,
  };
}
