import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Marquee from './Marquee.vue';

describe('Marquee', () => {
  it('renders the text twice, with the duplicate aria-hidden', () => {
    const wrapper = mount(Marquee, { props: { text: 'Now playing' } });
    const texts = wrapper.findAll('.marquee__text');
    expect(texts).toHaveLength(2);
    expect(texts[0].text()).toBe('Now playing');
    expect(texts[1].text()).toBe('Now playing');
    expect(texts[1].attributes('aria-hidden')).toBe('true');
  });

  it('separates the copies with a decorative bullet', () => {
    const wrapper = mount(Marquee, { props: { text: 'Now playing' } });
    const separators = wrapper.findAll('.marquee__separator');
    expect(separators).toHaveLength(2);
    expect(separators[0].text()).toBe('•');
    expect(separators[0].attributes('aria-hidden')).toBe('true');
  });

  it('exposes the marquee root and track classes', () => {
    const wrapper = mount(Marquee, { props: { text: 'Now playing' } });
    expect(wrapper.find('.marquee').exists()).toBe(true);
    expect(wrapper.find('.marquee__track').exists()).toBe(true);
  });
});
