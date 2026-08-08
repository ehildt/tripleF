import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import ProductResponse from './ProductResponse.vue';

function mountProduct(data: Partial<HarnessResponseData>) {
  return mount(ProductResponse, {
    global: { plugins: [createPinia()] },
    props: { data: data as HarnessResponseData },
  });
}

describe('ProductResponse', () => {
  it('renders banner with title and rating overlay', () => {
    const wrapper = mountProduct({
      title: 'Sony WH-1000XM5',
      shortDescription: 'Premium wireless noise-cancelling headphones.',
      category: 'Tech',
      aggregateRating: 4.6,
      aggregateRatingCount: 12847,
      aggregateRatingLabel: 'Excellent',
      heroImageUrl: 'https://example.com/hero.jpg',
    });

    expect(wrapper.find('.product-banner__title').text()).toBe(
      'Sony WH-1000XM5',
    );
    expect(wrapper.find('.product-banner__rating').exists()).toBe(true);
    expect(wrapper.text()).toContain('4.6');
    expect(wrapper.text()).toContain('Excellent');
  });

  it('renders the brief product description below the banner', () => {
    const wrapper = mountProduct({
      title: 'Widget',
      shortDescription: 'A concise product overview.',
    });

    expect(wrapper.find('.product__lead').text()).toBe(
      'A concise product overview.',
    );
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

  it('renders stat highlights and the full spec table', async () => {
    const wrapper = mountProduct({
      title: 'Widget',
      statHighlights: [{ label: 'Battery', value: '30 h' }],
      keyPoints: [{ text: 'Codec: LDAC' }],
    });

    expect(wrapper.find('.stat-highlights__value').text()).toBe('30 h');
    expect(wrapper.find('.stat-highlights__label').text()).toBe('Battery');
    expect(wrapper.find('.spec-list').exists()).toBe(true);
    expect(wrapper.text()).toContain('LDAC');
  });

  it('renders pros and cons', () => {
    const wrapper = mountProduct({
      title: 'Widget',
      pros: [{ text: 'Great battery' }],
      cons: [{ text: 'Heavy' }],
    });

    expect(wrapper.find('.pros-cons').exists()).toBe(true);
    expect(wrapper.text()).toContain('Great battery');
    expect(wrapper.text()).toContain('Heavy');
  });

  it('caps the video gallery at 3 videos', () => {
    const wrapper = mountProduct({
      title: 'Widget',
      videoGalleryItems: [
        { videoUrl: 'https://youtube.com/watch?v=1', title: 'V1' },
        { videoUrl: 'https://youtube.com/watch?v=2', title: 'V2' },
        { videoUrl: 'https://youtube.com/watch?v=3', title: 'V3' },
        { videoUrl: 'https://youtube.com/watch?v=4', title: 'V4' },
      ],
    });

    const items = wrapper.findAll('.video-gallery__item');
    expect(items).toHaveLength(3);
    expect(wrapper.find('.video-gallery--columns-3').exists()).toBe(true);
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

    expect(wrapper.find('.offer__shop').text()).toBe('Amazon');
  });

  it('renders sources section', () => {
    const wrapper = mountProduct({
      title: 'Widget',
      sources: [{ title: 'RTINGS', url: 'https://example.com/rtings' }],
    });

    expect(wrapper.find('.sources').exists()).toBe(true);
    expect(wrapper.text()).toContain('RTINGS');
  });

  it('renders empty state with no data', () => {
    const wrapper = mountProduct({});
    expect(wrapper.text()).toContain('No product info came back for this one.');
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
