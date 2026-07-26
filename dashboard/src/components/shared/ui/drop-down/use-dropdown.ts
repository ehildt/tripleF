import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { type Ref, ref } from 'vue';

export function useDropdown(
  containerRef: Ref<HTMLElement | null>,
  onSelect: (value: string) => void,
  onOpen?: () => void,
  disabled?: Ref<boolean>,
) {
  const open = ref(false);

  function toggle() {
    if (disabled?.value) return;
    if (!open.value) onOpen?.();
    open.value = !open.value;
  }

  function select(value: string) {
    onSelect(value);
    open.value = false;
  }

  function close() {
    open.value = false;
  }

  onClickOutside(containerRef, close);
  onKeyStroke('Escape', close);

  return { open, toggle, select, close };
}
