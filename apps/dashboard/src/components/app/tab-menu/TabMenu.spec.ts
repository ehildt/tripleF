import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import { i18n } from '@/i18n/i18n';

import {
  resetTabMenuSettings,
  setTabMenuAutoClose,
  setTabMenuSide,
} from './composables/tab-menu-settings.state';
import TabMenu from './TabMenu.vue';

// Nav aria-labels come from i18n (en default in tests); resolve them through
// the instance so the assertions stay locale-agnostic.
const navLabels = {
  chat: i18n.global.t('nav.chat'),
  memory: i18n.global.t('nav.memory'),
  dlq: i18n.global.t('nav.dlq'),
  debug: i18n.global.t('nav.debug'),
  settings: i18n.global.t('nav.settings'),
} as const;

// TabMenu uses useRoute() (to close on navigation) and NavMenu renders real
// RouterLinks, so a router must be installed. A memory router gives both a
// working useRoute and RouterLink without touching the app's routes.
function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/:pathMatch(.*)*',
        name: 'chat',
        component: { template: '<div />' },
      },
    ],
  });
}

function mountMenu(
  props: Record<string, unknown> = {},
  router: ReturnType<typeof createTestRouter> = createTestRouter(),
) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(TabMenu, {
    props: {
      activeTab: 'chat',
      debugCount: 0,
      ...props,
    } as any,
    global: { plugins: [pinia, router] },
  });
  return { wrapper, router };
}

async function clickNavItem(
  wrapper: ReturnType<typeof mountMenu>['wrapper'],
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

  it('renders all five tabs in the drawer', () => {
    const { wrapper } = mountMenu();
    const items = wrapper.findAll('.nav-menu__item');
    expect(items.map((item) => item.attributes('aria-label'))).toEqual([
      navLabels.chat,
      navLabels.memory,
      navLabels.dlq,
      navLabels.debug,
      navLabels.settings,
    ]);
  });

  it('pins the theme selector to the bottom of the drawer', () => {
    const { wrapper } = mountMenu();
    expect(wrapper.find('.tab-menu__footer .theme-selector').exists()).toBe(
      true,
    );
  });

  it('starts open, docked to the right edge by default', () => {
    const { wrapper } = mountMenu();
    expect(wrapper.classes()).toContain('tab-menu--right');
    expect(wrapper.classes()).not.toContain('tab-menu--closed');
    expect(wrapper.find('.tab-menu__handle').attributes('aria-expanded')).toBe(
      'true',
    );
  });

  it('docks to the left edge when configured', () => {
    setTabMenuSide('left');
    const { wrapper } = mountMenu();
    expect(wrapper.classes()).toContain('tab-menu--left');
  });

  it('navigates to the clicked tab via the router', async () => {
    const { wrapper, router } = mountMenu();
    await clickNavItem(wrapper, navLabels.dlq);
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/dlq');
  });

  it('marks the active tab', () => {
    const { wrapper } = mountMenu({ activeTab: 'dlq' });
    const active = wrapper.find('.nav-menu__item--active');
    expect(active.attributes('aria-label')).toBe(navLabels.dlq);
    expect(active.attributes('aria-current')).toBe('page');
  });

  it('shows per-tab count badges and the star when provided', () => {
    localStorage.setItem('harness-show-counters', 'true');
    const { wrapper } = mountMenu({
      activeTab: 'settings',
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
    const { wrapper } = mountMenu();
    const handle = wrapper.find('.tab-menu__handle');
    await handle.trigger('click');
    expect(wrapper.classes()).toContain('tab-menu--closed');
    expect(handle.attributes('aria-expanded')).toBe('false');
    await handle.trigger('click');
    expect(wrapper.classes()).not.toContain('tab-menu--closed');
  });

  it('stays open after picking a tab by default', async () => {
    const { wrapper } = mountMenu();
    await clickNavItem(wrapper, navLabels.debug);
    await flushPromises();
    expect(wrapper.classes()).not.toContain('tab-menu--closed');
  });

  it('closes after picking a tab when autoclose is on', async () => {
    setTabMenuAutoClose(true);
    const { wrapper } = mountMenu();
    await clickNavItem(wrapper, navLabels.debug);
    await flushPromises();
    expect(wrapper.classes()).toContain('tab-menu--closed');
  });
});
