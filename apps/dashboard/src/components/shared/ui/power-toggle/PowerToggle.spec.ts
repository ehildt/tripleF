import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PowerToggle from './PowerToggle.vue';

function mountToggle(props: Record<string, unknown> = {}) {
  return mount(PowerToggle, { props: { enabled: false, ...props } });
}

describe('PowerToggle', () => {
  it('renders the enabled state and the pressed semantics', () => {
    const wrapper = mountToggle({ enabled: true, title: 'Power' });

    const button = wrapper.find('button');
    expect(button.classes()).toContain('power-toggle--enabled');
    expect(button.attributes('aria-pressed')).toBe('true');
    expect(button.attributes('aria-label')).toBe('Power');
  });

  it('emits toggle on click', async () => {
    const wrapper = mountToggle();

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('toggle')).toHaveLength(1);
  });

  it('does not emit when disabled', async () => {
    const wrapper = mountToggle({ disabled: true });

    const button = wrapper.find('button');
    expect(button.attributes('disabled')).toBeDefined();
    await button.trigger('click');

    expect(wrapper.emitted('toggle')).toBeUndefined();
  });

  it('switches the accent tone class', () => {
    const wrapper = mountToggle({ enabled: true, tone: 'preprocessing' });
    expect(wrapper.find('button').classes()).toContain(
      'power-toggle--preprocessing',
    );
  });
});
