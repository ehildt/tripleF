import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { MenuTabItem } from './MenuTabs.types';
import MenuTabs from './MenuTabs.vue';

const ITEMS: MenuTabItem[] = [
  { id: 'alpha', label: 'Alpha' },
  { id: 'beta', label: 'Beta' },
  { id: 'gamma', label: 'Gamma' },
];

describe('MenuTabs', () => {
  it('emits select with the chosen tab id when a tab is clicked', async () => {
    const wrapper = mount(MenuTabs, {
      props: { variant: 'section', items: ITEMS, active: 'alpha' },
    });

    const gammaTab = wrapper
      .findAll('.menu-button')
      .find((tab) => tab.attributes('aria-label') === 'Gamma');

    expect(gammaTab).toBeDefined();
    await gammaTab!.trigger('click');

    expect(wrapper.emitted('select')).toHaveLength(1);
    expect(wrapper.emitted('select')![0]).toEqual(['gamma']);
  });

  it('emits select for each tab', async () => {
    const wrapper = mount(MenuTabs, {
      props: { variant: 'section', items: ITEMS, active: 'alpha' },
    });

    for (const label of ['Alpha', 'Beta', 'Gamma']) {
      const tab = wrapper
        .findAll('.menu-button')
        .find((t) => t.attributes('aria-label') === label);
      expect(tab).toBeDefined();
      await tab!.trigger('click');
    }

    expect(wrapper.emitted('select')).toHaveLength(3);
  });

  it('marks only the active tab as aria-selected', () => {
    const wrapper = mount(MenuTabs, {
      props: { variant: 'section', items: ITEMS, active: 'beta' },
    });

    const tabs = wrapper.findAll('.menu-button');
    expect(tabs.map((t) => t.attributes('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
    ]);
  });
});
