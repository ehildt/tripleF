import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AsyncImage from './AsyncImage.vue';

function mountImage(overrides: Record<string, unknown> = {}) {
  return mount(AsyncImage, {
    props: { src: '/a.png', ...overrides },
    global: {
      mocks: {
        $t: (key: string) => key,
      },
    },
  });
}

describe('AsyncImage', () => {
  it('shows the skeleton until the image fires its load event', async () => {
    const wrapper = mountImage();

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(true);
    expect(wrapper.find('img').classes()).not.toContain(
      'async-image__img--loaded',
    );

    await wrapper.find('img').trigger('load');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('async-image__img--loaded');
  });

  it('emits load after a successful image load', async () => {
    const wrapper = mountImage();
    await wrapper.find('img').trigger('load');
    expect(wrapper.emitted('load')).toHaveLength(1);
  });

  it('hides the skeleton and shows the fallback overlay on image error', async () => {
    const wrapper = mountImage();

    await wrapper.find('img').trigger('error');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('async-image__img--error');
    expect(wrapper.find('.async-image__error').exists()).toBe(true);
  });

  it('emits error after a failed image load', async () => {
    const wrapper = mountImage();
    await wrapper.find('img').trigger('error');
    expect(wrapper.emitted('error')).toHaveLength(1);
  });

  it('suppresses the error overlay when showErrorLabel is false', async () => {
    const wrapper = mountImage({ showErrorLabel: false });

    await wrapper.find('img').trigger('error');

    expect(wrapper.find('.async-image__error').exists()).toBe(false);
  });

  it('loads eagerly with high fetch priority when eager is set', () => {
    const wrapper = mountImage({ eager: true });
    const img = wrapper.find('img');
    expect(img.attributes('loading')).toBe('eager');
    expect(img.attributes('fetchpriority')).toBe('high');
  });

  it('loads lazily by default', () => {
    const wrapper = mountImage();
    expect(wrapper.find('img').attributes('loading')).toBe('lazy');
  });

  it('applies contain object-fit when requested', () => {
    const wrapper = mountImage({ fit: 'contain' });
    expect(wrapper.find('img').classes()).toContain(
      'async-image__img--contain',
    );
  });
});
