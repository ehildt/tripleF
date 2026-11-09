import type { Ref } from 'vue';

import type { useLightbox } from '@/components/shared/ui/lightbox/composables/use-lightbox';

export interface PreprocessingPreview {
  /** Whether flushing settings or generating the current preview is in progress. */
  isPreviewLoading: Ref<boolean>;
  /** Per-caller lightbox instance whose images come from this preview workflow. */
  lightbox: ReturnType<typeof useLightbox>;
  /** Select a new file from the native input event and begin previewing it. */
  onFilePicked: (event: Event) => void;
  /** Pick the first image or reuse the current image for another preview. */
  onPreviewClick: () => void;
  /** Close the current lightbox and request a different image. */
  repickImage: () => void;
}

/** Dashboard mirror of one `SharpPreviewService.preview` response entry. */
export interface SharpPreviewVariant {
  /** Server variant identifier used in the lightbox title. */
  variant: string;
  /** Original image name returned by the preview pipeline. */
  name: string;
  /** Human-readable variant description returned by the server. */
  description: string;
  /** Encoded preview image suitable for direct lightbox display. */
  dataUrl: string;
}
