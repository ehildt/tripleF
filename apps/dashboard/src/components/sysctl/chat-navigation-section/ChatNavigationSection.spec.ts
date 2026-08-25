import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAppStore } from '@/stores/app';

import ChatNavigationSection from './ChatNavigationSection.vue';

describe('ChatNavigationSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders a section header per config group', () => {
    const wrapper = mount(ChatNavigationSection);
    for (const title of ['Chat', 'Header actions', 'Charts']) {
      expect(wrapper.text()).toContain(title);
    }
  });

  it('renders the chart config cards', () => {
    const wrapper = mount(ChatNavigationSection);
    for (const label of [
      'Price style',
      'Volume style',
      'Heatmap variant',
      'Colormap',
    ]) {
      expect(wrapper.text()).toContain(label);
    }
  });

  it('updates the store when a price style is selected', async () => {
    const store = useAppStore();
    const wrapper = mount(ChatNavigationSection);
    await wrapper.find('button[aria-label="Line"]').trigger('click');
    expect(store.chartConfig.priceStyle).toBe('line');
  });

  it('toggles chart annotations from the checkbox cards', async () => {
    const store = useAppStore();
    const wrapper = mount(ChatNavigationSection);
    const markersCard = wrapper
      .findAll('.field-card')
      .find((card) => card.text().includes('Markers'));
    expect(markersCard).toBeDefined();
    await markersCard!.find('.field-card__checkbox').trigger('click');
    expect(store.chartConfig.showMarkers).toBe(false);
  });
});
