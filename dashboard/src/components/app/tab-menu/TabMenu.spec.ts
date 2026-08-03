import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  resetTabMenuSettings,
  setTabMenuAutoClose,
  setTabMenuSide,
} from './composables/tab-menu-settings.state';
import TabMenu from './TabMenu.vue';

function mountMenu(props: Record<string, unknown> = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(TabMenu, {
    props: {
      activeTab: 'http',
      debugCount: 0,
      ...props,
    } as any,
    global: { plugins: [pinia] },
  });
}

async function clickNavItem(
  wrapper: ReturnType<typeof mountMenu>,
  label: string,
) {
  const item = wrapper
    .findAll('.nav-menu__item')
    .find((b) => b.attributes('aria-label') === label);
  expect(item).toBeDefined();
  await item!.trigger('click');
}

describe('TabMenu', () => {
  beforeEach(() => {
    localStorage.clear();
    // dlq/debug are hidden by default; enable them so these tests exercise
    // the full menu (the hidden-by-default case is covered in useMenuTabs).
    localStorage.setItem(
      'harness-tab-visibility',
      JSON.stringify({ dlq: true, debug: true }),
    );
    resetTabMenuSettings();
  });

  it('renders all four tabs in the drawer', () => {
    const wrapper = mountMenu();
    const items = wrapper.findAll('.nav-menu__item');
    expect(items.map((item) => item.attributes('aria-label'))).toEqual([
      'chat',
      'dlq',
      'debug',
      'sysctl',
    ]);
  });

  it('pins the theme selector to the bottom of the drawer', () => {
    const wrapper = mountMenu();
    expect(wrapper.find('.tab-menu__footer .theme-selector').exists()).toBe(
      true,
    );
  });

  it('starts open, docked to the right edge by default', () => {
    const wrapper = mountMenu();
    expect(wrapper.classes()).toContain('tab-menu--right');
    expect(wrapper.classes()).not.toContain('tab-menu--closed');
    expect(wrapper.find('.tab-menu__handle').attributes('aria-expanded')).toBe(
      'true',
    );
  });

  it('docks to the left edge when configured', () => {
    setTabMenuSide('left');
    const wrapper = mountMenu();
    expect(wrapper.classes()).toContain('tab-menu--left');
  });

  it('emits tabChange when a tab icon is clicked', async () => {
    const wrapper = mountMenu();
    await clickNavItem(wrapper, 'dlq');
    expect(wrapper.emitted('tabChange')).toBeTruthy();
    expect(wrapper.emitted('tabChange')![0]).toEqual(['dlq']);
  });

  it('marks the active tab', () => {
    const wrapper = mountMenu({ activeTab: 'dlq' });
    const active = wrapper.find('.nav-menu__item--active');
    expect(active.attributes('aria-label')).toBe('dlq');
    expect(active.attributes('aria-current')).toBe('true');
  });

  it('shows per-tab count badges and the star when provided', () => {
    localStorage.setItem('harness-show-counters', 'true');
    const wrapper = mountMenu({
      activeTab: 'sysctl',
      debugCount: 5,
      showChatStar: true,
      dlqCount: 2,
    });
    const badgeTexts = wrapper
      .findAll('.nav-menu__badge')
      .map((badge) => badge.text());
    expect(badgeTexts).toContain('✦');
    expect(badgeTexts).toContain('2');
    expect(badgeTexts).toContain('5');
  });

  it('toggles the drawer via the edge handle', async () => {
    const wrapper = mountMenu();
    const handle = wrapper.find('.tab-menu__handle');
    await handle.trigger('click');
    expect(wrapper.classes()).toContain('tab-menu--closed');
    expect(handle.attributes('aria-expanded')).toBe('false');
    await handle.trigger('click');
    expect(wrapper.classes()).not.toContain('tab-menu--closed');
  });

  it('stays open after picking a tab by default', async () => {
    const wrapper = mountMenu();
    await clickNavItem(wrapper, 'debug');
    expect(wrapper.emitted('tabChange')![0]).toEqual(['debug']);
    expect(wrapper.classes()).not.toContain('tab-menu--closed');
  });

  it('closes after picking a tab when autoclose is on', async () => {
    setTabMenuAutoClose(true);
    const wrapper = mountMenu();
    await clickNavItem(wrapper, 'debug');
    expect(wrapper.emitted('tabChange')![0]).toEqual(['debug']);
    expect(wrapper.classes()).toContain('tab-menu--closed');
  });
});
