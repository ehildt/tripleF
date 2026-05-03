import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { THEMES, useThemeStore } from '../../../stores/theme';
import AppThemeSelector from './AppThemeSelector.vue';

describe('AppThemeSelector', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('renders a button', () => {
    const wrapper = mount(AppThemeSelector);
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('dropdown is closed by default', () => {
    const wrapper = mount(AppThemeSelector);
    expect(wrapper.text()).not.toContain('Dark Souls');
  });

  it('opens dropdown on button click', async () => {
    const wrapper = mount(AppThemeSelector);
    await wrapper.find('button').trigger('click');
    expect(wrapper.text()).toContain('Dark Souls');
  });

  it('shows all theme names in dropdown', async () => {
    const wrapper = mount(AppThemeSelector);
    await wrapper.find('button').trigger('click');

    for (const theme of THEMES) {
      expect(wrapper.text()).toContain(theme.name);
    }
  });

  it('selects a theme on item click', async () => {
    const store = useThemeStore();
    const wrapper = mount(AppThemeSelector);

    await wrapper.find('button').trigger('click');
    const items = wrapper.findAll('button');

    const targetItem = items.find((b) => b.text().includes('Nioh'));
    expect(targetItem).toBeTruthy();
    await targetItem!.trigger('click');

    expect(store.currentTheme).toBe('nioh');
  });

  it('stays open after selecting a theme', async () => {
    const wrapper = mount(AppThemeSelector);

    await wrapper.find('button').trigger('click');
    const items = wrapper.findAll('button');
    const targetItem = items.find((b) => b.text().includes('Nioh'));
    await targetItem!.trigger('click');

    expect(wrapper.text()).toContain('Nioh');
  });

  it('closes dropdown on icon button click', async () => {
    const wrapper = mount(AppThemeSelector);

    await wrapper.find('button').trigger('click');
    expect(wrapper.text()).toContain('Dark Souls');

    await wrapper.find('button').trigger('click');
    expect(wrapper.text()).not.toContain('Dark Souls');
  });

  it('closes dropdown on click outside', async () => {
    const wrapper = mount(AppThemeSelector);

    await wrapper.find('button').trigger('click');
    expect(wrapper.text()).toContain('Dark Souls');

    document.dispatchEvent(new MouseEvent('click'));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).not.toContain('Dark Souls');
  });

  it('closes dropdown on Escape key', async () => {
    const wrapper = mount(AppThemeSelector);

    await wrapper.find('button').trigger('click');
    expect(wrapper.text()).toContain('Dark Souls');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).not.toContain('Dark Souls');
  });

  it('shows moon/sun toggle button', () => {
    const wrapper = mount(AppThemeSelector);
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('toggles dark mode on moon/sun click', () => {
    const store = useThemeStore();
    const wrapper = mount(AppThemeSelector);
    const buttons = wrapper.findAll('button');

    const toggle = buttons.find(
      (b) => b.attributes('title')?.includes('light') ?? false,
    );
    expect(toggle).toBeTruthy();

    toggle!.trigger('click');
    expect(store.isDarkMode).toBe(false);
  });
});
