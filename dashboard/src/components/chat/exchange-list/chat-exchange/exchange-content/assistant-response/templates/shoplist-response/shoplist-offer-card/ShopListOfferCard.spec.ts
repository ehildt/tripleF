import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { ShopOffer } from '@/types/harness-response-data.model';

import ShopListOfferCard from './ShopListOfferCard.vue';

function mountCard(offer: Partial<ShopOffer>) {
  return mount(ShopListOfferCard, {
    props: { offer: offer as ShopOffer },
  });
}

describe('ShopListOfferCard', () => {
  it('renders the offer title, price and source', () => {
    const wrapper = mountCard({
      title: 'Widget',
      price: '$9.99',
      source: 'Shopify',
      link: 'https://shop.example.com/w',
    });

    expect(wrapper.text()).toContain('Widget');
    expect(wrapper.text()).toContain('$9.99');
    expect(wrapper.text()).toContain('View at Shopify');
  });

  it('shows the skeleton until the image fires its load event', async () => {
    const wrapper = mountCard({ title: 'T', imageUrl: '/a.png' });

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(true);

    await wrapper.find('img').trigger('load');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('async-image__img--loaded');
  });

  it('settles on a quiet empty thumb when the image fails to load', async () => {
    const wrapper = mountCard({ title: 'T', imageUrl: '/missing.png' });

    await wrapper.find('img').trigger('error');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    // No error overlay: the 4.5rem thumb has no room for a message.
    expect(wrapper.find('.async-image__error').exists()).toBe(false);
  });

  it('omits the thumb when there is no imageUrl', () => {
    const wrapper = mountCard({ title: 'T' });

    expect(wrapper.find('.shoplist-card__thumb').exists()).toBe(false);
  });
});
