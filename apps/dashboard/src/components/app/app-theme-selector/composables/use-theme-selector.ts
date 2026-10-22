import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { ref } from 'vue';

/**
 * Theme palette dropdown open/close state: owns the container ref, the
 * outside-click and Escape closers. The palette data and its switch behavior
 * are bound straight from use-theme and theme.constant by the component.
 */
export function useThemeSelector() {
  const isDropdownOpen = ref(false);
  const containerRef = ref<HTMLElement | null>(null);

  function toggleDropdown() {
    isDropdownOpen.value = !isDropdownOpen.value;
  }

  function closeDropdown() {
    isDropdownOpen.value = false;
  }

  onClickOutside(containerRef, () => {
    if (isDropdownOpen.value) closeDropdown();
  });
  onKeyStroke('Escape', () => {
    if (isDropdownOpen.value) closeDropdown();
  });

  return {
    containerRef,
    isDropdownOpen,
    toggleDropdown,
    closeDropdown,
  };
}
