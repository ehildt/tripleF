import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import PprocSection from './PprocSection.vue';

const StubIcon = () => h('div');

describe('PprocSection', () => {
  it('renders title and icon', () => {
    const wrapper = mount(PprocSection, {
      props: { icon: StubIcon, title: 'Parameters' },
    });
    expect(wrapper.text()).toContain('Parameters');
  });

  it('renders slot content', () => {
    const wrapper = mount(PprocSection, {
      props: { icon: StubIcon, title: 'Params' },
      slots: { default: '<div data-testid="content">Content</div>' },
    });
    expect(wrapper.find('[data-testid="content"]').exists()).toBe(true);
  });

  it('renders action slot', () => {
    const wrapper = mount(PprocSection, {
      props: { icon: StubIcon, title: 'Params' },
      slots: { action: '<button>Reset</button>' },
    });
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.text()).toContain('Reset');
  });
});
