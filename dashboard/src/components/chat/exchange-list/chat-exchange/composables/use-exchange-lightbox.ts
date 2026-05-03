import { onMounted, onUnmounted, ref } from 'vue';

export function useExchangeLightbox() {
  const isOpen = ref(false);
  const images = ref<string[]>([]);
  const index = ref(0);

  function openImages(allImages: string[], clickedSrc: string) {
    const startIdx = allImages.findIndex((s) => s === clickedSrc);
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

  function onKeydown(e: KeyboardEvent) {
    if (!isOpen.value) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
  }

  onMounted(() => {
    document.addEventListener('keydown', onKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', onKeydown);
  });

  return {
    isOpen,
    images,
    index,
    openImages,
    close,
    goPrev,
    goNext,
  };
}
