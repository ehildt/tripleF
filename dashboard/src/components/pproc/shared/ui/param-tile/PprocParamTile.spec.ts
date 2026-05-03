import type { LucideIcon } from '@lucide/vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PprocParamTile from './PprocParamTile.vue';

describe('PprocParamTile', () => {
  it('renders label and description', () => {
    const wrapper = mount(PprocParamTile, {
      props: { label: 'Brightness', icon: 'div' as unknown as LucideIcon },
      slots: { default: '2.0' },
    });
    expect(wrapper.text()).toContain('Brightness');
  });

  it('shows description when provided', () => {
    const wrapper = mount(PprocParamTile, {
      props: {
        label: 'Blur',
        icon: 'div' as unknown as LucideIcon,
        description: 'Gaussian blur amount',
      },
    });
    expect(wrapper.text()).toContain('Gaussian blur amount');
  });

  it('shows reset button when modified', () => {
    const wrapper = mount(PprocParamTile, {
      props: {
        label: 'Blur',
        icon: 'div' as unknown as LucideIcon,
        modified: true,
      },
    });
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('does not show reset button when not modified', () => {
    const wrapper = mount(PprocParamTile, {
      props: {
        label: 'Blur',
        icon: 'div' as unknown as LucideIcon,
        modified: false,
      },
    });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('emits reset when reset button clicked', async () => {
    const wrapper = mount(PprocParamTile, {
      props: {
        label: 'Blur',
        icon: 'div' as unknown as LucideIcon,
        modified: true,
      },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('reset')).toHaveLength(1);
  });

  it('applies highlighted ring class', () => {
    const wrapper = mount(PprocParamTile, {
      props: {
        label: 'Blur',
        icon: 'div' as unknown as LucideIcon,
        highlighted: true,
      },
    });
    expect(wrapper.find('div').classes().join(' ')).toContain('ring-2');
  });
});
