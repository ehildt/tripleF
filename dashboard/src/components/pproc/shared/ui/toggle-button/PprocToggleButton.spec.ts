import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PprocToggleButton from './PprocToggleButton.vue';

describe('PprocToggleButton', () => {
  it('renders in unselected state', () => {
    const wrapper = mount(PprocToggleButton, {
      props: { selected: false },
      slots: { content: 'Original' },
    });
    expect(wrapper.text()).toContain('Original');
    expect(wrapper.find('button').classes().join(' ')).toContain('bg-primary');
  });

  it('renders in selected state with different class', () => {
    const wrapper = mount(PprocToggleButton, {
      props: { selected: true },
      slots: { content: 'Grayscale' },
    });
    expect(wrapper.text()).toContain('Grayscale');
    expect(wrapper.find('button').classes().join(' ')).toContain(
      'bg-secondary',
    );
  });

  it('applies disabled styling', () => {
    const wrapper = mount(PprocToggleButton, {
      props: { selected: false, disabled: true },
    });
    const btn = wrapper.find('button');
    expect(btn.classes().join(' ')).toContain('cursor-not-allowed');
    expect(btn.classes().join(' ')).toContain('opacity-60');
  });

  it('applies highlighted styling', () => {
    const wrapper = mount(PprocToggleButton, {
      props: { selected: false, highlighted: true },
    });
    const btn = wrapper.find('button');
    expect(btn.classes().join(' ')).toContain('ring-2');
    expect(btn.classes().join(' ')).toContain('animate-pulse');
  });

  it('emits click when not disabled', async () => {
    const wrapper = mount(PprocToggleButton, {
      props: { selected: false },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not emit click when disabled', async () => {
    const wrapper = mount(PprocToggleButton, {
      props: { selected: false, disabled: true },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('renders gradient overlay when selected and not disabled', () => {
    const wrapper = mount(PprocToggleButton, {
      props: { selected: true, disabled: false },
    });
    expect(wrapper.find('div.absolute').exists()).toBe(true);
  });

  it('does not render gradient when disabled', () => {
    const wrapper = mount(PprocToggleButton, {
      props: { selected: true, disabled: true },
    });
    expect(wrapper.find('div.absolute').exists()).toBe(false);
  });
});
