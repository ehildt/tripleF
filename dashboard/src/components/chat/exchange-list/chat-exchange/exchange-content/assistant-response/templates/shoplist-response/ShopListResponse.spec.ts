import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import type {
  HarnessResponseData,
  ShopOffer,
} from '@/types/harness-response-data.model';

import ShopListResponse from './ShopListResponse.vue';

function mountShopList(data: Partial<HarnessResponseData>) {
  return mount(ShopListResponse, {
    global: { plugins: [createPinia()] },
    props: { data: data as HarnessResponseData },
  });
}

describe('ShopListResponse', () => {
  it('renders the header with title, subtitle, and description', () => {
    const wrapper = mountShopList({
      title: 'Sony WH-1000XM5',
      subtitle: 'Current purchase options',
      shortDescription: 'The MediaMarkt offer dropped €30 since last week.',
    });

    expect(wrapper.find('.shoplist__title').text()).toBe('Sony WH-1000XM5');
    expect(wrapper.find('.shoplist__subtitle').text()).toContain(
      'purchase options',
    );
    expect(wrapper.text()).toContain('dropped €30');
  });

  it('renders offer cards sorted by ascending price', () => {
    const wrapper = mountShopList({
      title: 'Widget',
      shopOffers: [
        {
          title: 'Expensive',
          price: '€500.00',
          source: 'X',
          link: 'https://x.example',
        },
        {
          title: 'Cheap',
          price: '€50.00',
          source: 'Y',
          link: 'https://y.example',
        },
      ],
    });

    const prices = wrapper.findAll('.shoplist-card__price');
    expect(prices[0].text()).toBe('€50.00');
    expect(prices[1].text()).toBe('€500.00');
  });

  it('marks only the cheapest offer as best price', () => {
    const wrapper = mountShopList({
      title: 'Widget',
      shopOffers: [
        { title: 'A', price: '€70', source: 'X', link: 'https://x.example' },
        { title: 'B', price: '€60', source: 'Y', link: 'https://y.example' },
      ],
    });

    const best = wrapper.findAll('.shoplist-card__best');
    expect(best).toHaveLength(1);
  });

  it('sorts installment prices after one-time prices', () => {
    const offers: ShopOffer[] = [
      { title: 'Installment', price: '$29.12/mo', link: 'https://i.example' },
      { title: 'One-time', price: '$349', link: 'https://o.example' },
    ];

    const wrapper = mountShopList({ title: 'Widget', shopOffers: offers });

    const titles = wrapper.findAll('.shoplist-card__title');
    expect(titles[0].text()).toBe('One-time');
    expect(titles[1].text()).toBe('Installment');
  });

  it('links the CTA directly to the offer link with the store label', () => {
    const wrapper = mountShopList({
      title: 'Widget',
      shopOffers: [
        {
          title: 'Widget',
          price: '€50',
          source: 'Amazon',
          link: 'https://amazon.example/widget',
        },
      ],
    });

    const cta = wrapper.find('.shoplist-card__cta');
    expect(cta.attributes('href')).toBe('https://amazon.example/widget');
    expect(cta.text()).toContain('View at Amazon');
  });

  it('renders the offer image when an imageUrl is provided', () => {
    const wrapper = mountShopList({
      title: 'Widget',
      shopOffers: [
        {
          title: 'Widget',
          price: '€50',
          imageUrl: 'https://img.example/widget.jpg',
          link: 'https://o.example',
        },
      ],
    });

    expect(wrapper.find('.shoplist-card__img').attributes('src')).toBe(
      'https://img.example/widget.jpg',
    );
  });

  it('shows the empty state when nothing is present', () => {
    const wrapper = mountShopList({});

    expect(wrapper.find('.empty-state-section').exists()).toBe(true);
  });
});
