import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ProviderSelector from './ProviderSelector.vue';

const allConfiguredAndEnabled = {
  serper: true,
  brave: true,
  searxng: true,
  browserBase: true,
};

describe('ProviderSelector', () => {
  it('renders one button per provider', () => {
    const wrapper = mount(ProviderSelector, {
      props: {
        selectedProvider: 'serper',
        configuredProviders: allConfiguredAndEnabled,
        enabledProviders: allConfiguredAndEnabled,
      },
    });
    expect(wrapper.findAll('button').length).toBe(4);
  });

  it('marks the selected provider button as active', () => {
    const wrapper = mount(ProviderSelector, {
      props: {
        selectedProvider: 'brave',
        configuredProviders: allConfiguredAndEnabled,
        enabledProviders: allConfiguredAndEnabled,
      },
    });
    const buttons = wrapper.findAll('button');
    expect(buttons[1]?.classes()).toContain(
      'provider-selector__button--active',
    );
  });

  it('emits selectProvider when an available button is clicked', async () => {
    const wrapper = mount(ProviderSelector, {
      props: {
        selectedProvider: 'serper',
        configuredProviders: allConfiguredAndEnabled,
        enabledProviders: allConfiguredAndEnabled,
      },
    });
    await wrapper.findAll('button')[2]?.trigger('click');
    expect(wrapper.emitted('selectProvider')).toEqual([['searxng']]);
  });

  it('does not emit selectProvider when a disabled button is clicked', async () => {
    const wrapper = mount(ProviderSelector, {
      props: {
        selectedProvider: 'serper',
        configuredProviders: allConfiguredAndEnabled,
        enabledProviders: {
          serper: true,
          brave: true,
          searxng: false,
          browserBase: true,
        },
      },
    });
    await wrapper.findAll('button')[2]?.trigger('click');
    expect(wrapper.emitted('selectProvider')).toBeUndefined();
  });
});
