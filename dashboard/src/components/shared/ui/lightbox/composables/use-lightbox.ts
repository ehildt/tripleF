import { onKeyStroke } from '@vueuse/core';
import { computed, ref } from 'vue';

export interface LightboxImage {
  url: string;
  title?: string;
}

export function useLightbox() {
  const isOpen = ref(false);
  const images = ref<LightboxImage[]>([]);
  const index = ref(0);

  // Active image's title derived from current selection
  const activeTitle = computed(() => images.value[index.value]?.title ?? '');

  function openImages(allImages: LightboxImage[], clickedUrl: string) {
    const startIdx = allImages.findIndex((img) => img.url === clickedUrl);
    if (startIdx === -1) return;
    images.value = allImages;
    index.value = startIdx;
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
  }

  function goPrev() {
    if (index.value > 0) index.value--;
  }

  function goNext() {
    if (index.value < images.value.length - 1) index.value++;
  }

  onKeyStroke('Escape', () => {
    if (isOpen.value) close();
  });
  onKeyStroke('ArrowLeft', () => {
    if (isOpen.value) goPrev();
  });
  onKeyStroke('ArrowRight', () => {
    if (isOpen.value) goNext();
  });

  return {
    isOpen,
    images,
    index,
    activeTitle,
    openImages,
    close,
    goPrev,
    goNext,
  };
}
