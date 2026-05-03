import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PprocMasterToggle from './PprocMasterToggle.vue';

describe('PprocMasterToggle', () => {
  it('renders enabled state', () => {
    const wrapper = mount(PprocMasterToggle, {
      props: { enabled: true },
      slots: {
        title: 'Preprocessing',
        description: 'Enable image preprocessing filters',
      },
    });
    expect(wrapper.text()).toContain('Preprocessing');
    expect(wrapper.text()).toContain('Enable image preprocessing filters');
    expect(wrapper.find('button').classes().join(' ')).toContain(
      'bg-secondary',
    );
  });

  it('renders disabled state', () => {
    const wrapper = mount(PprocMasterToggle, {
      props: { enabled: false },
      slots: { title: 'Off' },
    });
    expect(wrapper.find('button').classes().join(' ')).toContain('bg-primary');
  });

  it('emits toggle on click', async () => {
    const wrapper = mount(PprocMasterToggle, {
      props: { enabled: false },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('toggle')).toHaveLength(1);
  });

  it('shows check icon when enabled', () => {
    const wrapper = mount(PprocMasterToggle, {
      props: { enabled: true },
    });
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('hides check icon when disabled', () => {
    const wrapper = mount(PprocMasterToggle, {
      props: { enabled: false },
    });
    expect(wrapper.find('svg').exists()).toBe(false);
  });
});
