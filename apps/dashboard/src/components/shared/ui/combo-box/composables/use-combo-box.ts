import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { nextTick, type Ref, ref } from 'vue';

/**
 * Open/select state for the ComboBox: a trigger that shows the value or a
 * placeholder and opens a menu containing a free-text input (create a new
 * value) above a divider and the existing options (pick one).
 */
export function useComboBox(
  containerRef: Ref<HTMLElement | null>,
  menuInputRef: Ref<HTMLInputElement | null>,
  onSelect: (value: string) => void,
) {
  const open = ref(false);

  async function toggle() {
    open.value = !open.value;
    if (open.value) {
      // The menu input is where a new value is typed — put the caret there
      // right away so clicking the trigger means "start typing".
      await nextTick();
      menuInputRef.value?.focus();
    }
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
