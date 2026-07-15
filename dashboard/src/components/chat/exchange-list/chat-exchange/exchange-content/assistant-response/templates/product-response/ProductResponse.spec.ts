import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type {
  HarnessResponseData,
  ShopOffer,
} from '@/types/harness-response-data.model';

import ProductResponse from './ProductResponse.vue';

function mountProduct(data: Partial<HarnessResponseData>) {
  return mount(ProductResponse, {
    props: { data: data as HarnessResponseData },
  });
}

describe('ProductResponse', () => {
  it('renders spotlight hero with title and lead description', () => {
    const wrapper = mountProduct({
      title: 'Sony WH-1000XM5',
      shortDescription: 'Premium wireless noise-cancelling headphones.',
      category: 'Tech',
    });

    expect(wrapper.find('.spotlight__title').text()).toBe('Sony WH-1000XM5');
    expect(wrapper.find('.spotlight__lead').text()).toContain(
      'Premium wireless',
    );
  });

  it('renders cheapest price tag from sorted offers', () => {
    const offers: ShopOffer[] = [
      { title: 'A', price: '€399.00', source: 'X', link: 'https://x.com' },
      { title: 'B', price: '€249.00', source: 'Y', link: 'https://y.com' },
    ];

    const wrapper = mountProduct({
      title: 'Widget',
      shopOffers: offers,
    });

    expect(wrapper.text()).toContain('From €249.00');
  });

  it('renders offer count in the buy bar', () => {
    const wrapper = mountProduct({
      title: 'Widget',
      shopOffers: [
        { title: 'T1', price: '€50', source: 'Store A', link: 'https://a.com' },
        { title: 'T2', price: '€60', source: 'Store B', link: 'https://b.com' },
        { title: 'T3', price: '€70', source: 'Store C', link: 'https://c.com' },
      ],
    });

    expect(wrapper.text()).toContain('from 3 stores');
  });

  it('renders specs as spec-list rows', () => {
    const wrapper = mountProduct({
      title: 'Widget',
      keyPoints: [{ text: '30h battery' }, { text: 'ANC on' }],
    });

    expect(wrapper.find('.spec-list').exists()).toBe(true);
    expect(wrapper.text()).toContain('30h battery');
    expect(wrapper.text()).toContain('ANC on');
  });

  it('renders stat highlights and expands the full spec table', async () => {
    const wrapper = mountProduct({
      title: 'Widget',
      statHighlights: [{ label: 'Battery', value: '30 h' }],
      keyPoints: [{ text: 'Codec: LDAC' }],
    });

    expect(wrapper.find('.stat-highlights__value').text()).toBe('30 h');
    expect(wrapper.find('.stat-highlights__label').text()).toBe('Battery');
    expect(wrapper.find('.spec-list').exists()).toBe(false);

    await wrapper.find('.stat-highlights__toggle').trigger('click');
    expect(wrapper.find('.spec-list').exists()).toBe(true);
    expect(wrapper.text()).toContain('LDAC');
  });

  it('renders shop offer cards sorted by price', () => {
    const wrapper = mountProduct({
      title: 'Widget',
      shopOffers: [
        {
          title: 'Expensive',
          price: '€500.00',
          source: 'X',
          link: 'https://x.com',
        },
        { title: 'Cheap', price: '€50.00', source: 'Y', link: 'https://y.com' },
      ],
    });

    const prices = wrapper.findAll('.offer__price');
    expect(prices[0].text()).toBe('€50.00');
    expect(prices[1].text()).toBe('€500.00');
  });

  it('renders store badge in shop offer card', () => {
    const wrapper = mountProduct({
      title: 'Widget',
      shopOffers: [
        { title: 'T', price: '€19', source: 'Amazon', link: 'https://a.com' },
      ],
    });

    expect(wrapper.find('.offer__store-badge').text()).toBe('Amazon');
  });

  it('renders review highlights in reviews section', () => {
    const wrapper = mountProduct({
      title: 'Widget',
      reviewSummary: [
        { text: 'Great battery life.' },
        { text: 'Comfortable fit.' },
      ],
    });

    expect(wrapper.find('.reviews-section').exists()).toBe(true);
    expect(wrapper.text()).toContain('Review highlights');
    expect(wrapper.text()).toContain('Great battery life.');
  });

  it('renders empty state with no data', () => {
    const wrapper = mountProduct({});
    expect(wrapper.text()).toContain('No product information found');
  });

  it('shows "Check price" when offer has no price', () => {
    const wrapper = mountProduct({
      title: 'Widget',
      shopOffers: [
        {
          title: 'Unknown price item',
          source: 'Mystery',
          link: 'https://m.com',
        },
      ],
    });

    expect(wrapper.find('.offer__price').text()).toBe('Check price');
  });

  it('renders external offer links with target="_blank"', () => {
    const wrapper = mountProduct({
      title: 'Widget',
      shopOffers: [
        {
          title: 'T',
          price: '€9.99',
          source: 'X',
          link: 'https://example.com',
        },
      ],
    });

    const link = wrapper.find('a.offer__link');
    expect(link.exists()).toBe(true);
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
  });
});
