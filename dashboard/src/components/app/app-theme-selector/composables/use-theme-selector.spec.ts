import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { defineComponent, nextTick } from 'vue';

import { useThemeStore } from '../../../../stores/theme';
import { useThemeSelector } from './use-theme-selector';

function mountComposable() {
  const pinia = createPinia();
  setActivePinia(pinia);

  const TestComponent = defineComponent({
    setup() {
      return useThemeSelector();
    },
    template: '<div ref="containerRef" />',
  });

  const wrapper = mount(TestComponent, {
    global: { plugins: [pinia] },
    attachTo: document.body,
  });

  return { vm: wrapper.vm, wrapper };
}

describe('useThemeSelector', () => {
  it('starts with dropdown closed', () => {
    const { vm } = mountComposable();
    expect(vm.isDropdownOpen).toBe(false);
  });

  it('toggles dropdown open and closed', () => {
    const { vm } = mountComposable();
    vm.toggleDropdown();
    expect(vm.isDropdownOpen).toBe(true);
    vm.toggleDropdown();
    expect(vm.isDropdownOpen).toBe(false);
  });

  it('selects a theme through the store', () => {
    const { vm } = mountComposable();
    const store = useThemeStore();

    vm.selectTheme('nioh');
    expect(store.currentTheme).toBe('nioh');
  });

  it('exposes the current primary color', () => {
    const { vm } = mountComposable();
    const store = useThemeStore();

    store.currentTheme = 'yakuza';
    expect(vm.currentPrimary).toBe('#00b8a9');
  });

  it('closes dropdown on Escape', async () => {
    const { vm } = mountComposable();
    vm.toggleDropdown();
    expect(vm.isDropdownOpen).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(vm.isDropdownOpen).toBe(false);
  });

  it('closes dropdown on click outside', async () => {
    const { vm } = mountComposable();
    vm.toggleDropdown();
    expect(vm.isDropdownOpen).toBe(true);

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(vm.isDropdownOpen).toBe(false);
  });
});
