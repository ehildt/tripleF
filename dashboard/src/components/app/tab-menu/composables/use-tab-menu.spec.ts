import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { defineComponent, ref } from 'vue';

import {
  resetTabMenuSettings,
  setTabMenuAutoClose,
  setTabMenuSide,
} from './tab-menu-settings.state';
import { useTabMenu } from './use-tab-menu';

const Probe = defineComponent({
  setup() {
    const menuRef = ref<HTMLElement | null>(null);
    const menu = useTabMenu(menuRef);
    return { menuRef, ...menu };
  },
  template: '<div ref="menuRef"><button class="inside" /></div>',
});

describe('useTabMenu', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTabMenuSettings();
  });

  it('starts open on the right side by default', () => {
    const wrapper = mount(Probe);
    expect(wrapper.vm.isOpen).toBe(true);
    expect(wrapper.vm.side).toBe('right');
  });

  it('toggles closed and open again', () => {
    const wrapper = mount(Probe);
    wrapper.vm.toggleMenu();
    expect(wrapper.vm.isOpen).toBe(false);
    wrapper.vm.toggleMenu();
    expect(wrapper.vm.isOpen).toBe(true);
  });

  it('closes on Escape', () => {
    const wrapper = mount(Probe);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.vm.isOpen).toBe(false);
  });

  it('keeps the drawer open on closeOnAutoclose when autoclose is off', () => {
    const wrapper = mount(Probe);
    wrapper.vm.closeOnAutoclose();
    expect(wrapper.vm.isOpen).toBe(true);
  });

  it('closes the drawer on closeOnAutoclose when autoclose is on', () => {
    setTabMenuAutoClose(true);
    const wrapper = mount(Probe);
    wrapper.vm.closeOnAutoclose();
    expect(wrapper.vm.isOpen).toBe(false);
  });

  it('closes on an outside click when autoclose is on', () => {
    setTabMenuAutoClose(true);
    const wrapper = mount(Probe);
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    document.body.dispatchEvent(new Event('click', { bubbles: true }));
    expect(wrapper.vm.isOpen).toBe(false);
  });

  it('stays open on an outside click when autoclose is off', () => {
    const wrapper = mount(Probe);
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    document.body.dispatchEvent(new Event('click', { bubbles: true }));
    expect(wrapper.vm.isOpen).toBe(true);
  });

  it('ignores clicks inside the menu even with autoclose on', () => {
    setTabMenuAutoClose(true);
    const wrapper = mount(Probe, { attachTo: document.body });
    const inside = wrapper.find('.inside').element as HTMLElement;
    inside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    inside.dispatchEvent(new Event('click', { bubbles: true }));
    expect(wrapper.vm.isOpen).toBe(true);
    wrapper.unmount();
  });

  it('reflects the configured side', () => {
    setTabMenuSide('left');
    const wrapper = mount(Probe);
    expect(wrapper.vm.side).toBe('left');
  });
});
