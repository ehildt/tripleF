import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, nextTick } from 'vue';

import { useThemeSelector } from './use-theme-selector';

function mountComposable() {
  const TestComponent = defineComponent({
    setup() {
      return useThemeSelector();
    },
    template: '<div ref="containerRef" />',
  });

  const wrapper = mount(TestComponent, {
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

  it('closes dropdown on Escape', async () => {
    const { vm } = mountComposable();
    vm.toggleDropdown();
    expect(vm.isDropdownOpen).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
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
