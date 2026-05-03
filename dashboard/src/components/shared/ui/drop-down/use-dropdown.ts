import { onMounted, onUnmounted, type Ref, ref } from 'vue';

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

  function handleClickOutside(e: MouseEvent) {
    if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
      open.value = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') open.value = false;
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleKeydown);
  });

  return { open, toggle, select, close };
}
