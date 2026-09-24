import {
  type ComponentPublicInstance,
  nextTick,
  type Ref,
  ref,
  watch,
} from 'vue';

const BOTTOM_THRESHOLD_PX = 24;

/**
 * Keeps the reasoning stream pinned to the bottom while it grows, unless the
 * user scrolled up to read. Scrolling back to the bottom resumes autoscroll.
 */
export function useReasoningAutoscroll(reasoning: Ref<string | undefined>) {
  const reasoningElement = ref<HTMLElement | null>(null);
  const isPinnedToBottom = ref(true);

  /** Function template ref — keeps the element binding inside the composable. */
  function setReasoningElement(el: Element | ComponentPublicInstance | null) {
    reasoningElement.value = el instanceof HTMLElement ? el : null;
  }

  function handleScroll() {
    const el = reasoningElement.value;
    if (!el) return;
    isPinnedToBottom.value =
      el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD_PX;
  }

  watch(reasoning, async () => {
    await nextTick();
    const el = reasoningElement.value;
    if (!el || !isPinnedToBottom.value) return;
    el.scrollTop = el.scrollHeight;
  });

  return { setReasoningElement, handleScroll };
}
