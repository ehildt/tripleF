import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import MediaImageCard from './MediaImageCard.vue';

function mountCard(props: { imageUrl: string; imageAlt?: string }) {
  return mount(MediaImageCard, { props });
}

describe('MediaImageCard', () => {
  it('shows the skeleton until the image fires its load event', async () => {
    const wrapper = mountCard({ imageUrl: '/a.png' });

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(true);
    expect(wrapper.find('img').classes()).not.toContain(
      'async-image__img--loaded',
    );

    await wrapper.find('img').trigger('load');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('async-image__img--loaded');
  });

  it('marks the trigger as failed on image error', async () => {
    const wrapper = mountCard({ imageUrl: '/missing.png' });

    await wrapper.find('img').trigger('error');

    expect(wrapper.find('img').classes()).toContain('async-image__img--error');
    expect(wrapper.find('button').classes()).toContain(
      'media-image-card__trigger--error',
    );
  });

  it('emits click with the image url and alt', async () => {
    const wrapper = mountCard({ imageUrl: '/a.png', imageAlt: 'photo' });
    await wrapper.find('img').trigger('load');

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('click')).toEqual([['/a.png', 'photo']]);
  });

  it('does not emit click after the image failed to load', async () => {
    const wrapper = mountCard({ imageUrl: '/missing.png' });
    await wrapper.find('img').trigger('error');

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('click')).toBeUndefined();
  });
});
