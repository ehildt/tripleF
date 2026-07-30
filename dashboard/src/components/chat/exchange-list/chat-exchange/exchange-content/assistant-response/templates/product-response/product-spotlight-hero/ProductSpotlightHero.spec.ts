import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import ProductSpotlightHero from './ProductSpotlightHero.vue';

const baseProps = {
  category: 'Tech',
  title: 'Sony WH-1000XM5 Wireless Headphones',
  subtitle: 'Premium noise-cancelling headphones',
  description: 'Industry-leading noise cancellation.',
  imageUrl: 'https://example.com/hero.jpg',
  imageAlt: 'Hero',
  rating: 4.6,
  ratingCount: 12847,
  ratingLabel: 'Excellent',
  priceRange: '€289.00 – €319.00',
  offerCount: 3,
  buyAdvice: 'Buy at MediaMarkt.',
  bestOffer: {
    source: 'MediaMarkt',
    price: '€289.00',
    link: 'https://mm.example',
  },
};

describe('ProductSpotlightHero', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the info column with title and price', () => {
    const wrapper = mount(ProductSpotlightHero, {
      props: baseProps,
      global: { provide: { [harnessImageClickedKey]: vi.fn() } },
    });
    expect(wrapper.text()).toContain(baseProps.title);
    expect(wrapper.text()).toContain(baseProps.priceRange);
  });

  it('renders media and info sections', () => {
    const wrapper = mount(ProductSpotlightHero, {
      props: baseProps,
      global: { provide: { [harnessImageClickedKey]: vi.fn() } },
    });
    expect(wrapper.find('.spotlight__media').exists()).toBe(true);
    expect(wrapper.find('.spotlight__info').exists()).toBe(true);
  });

  it('emits image click via injected handler from the main trigger', async () => {
    const handler = vi.fn();
    const wrapper = mount(ProductSpotlightHero, {
      props: baseProps,
      global: { provide: { [harnessImageClickedKey]: handler } },
    });
    await wrapper.find('.spotlight__trigger').trigger('click');
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrl: baseProps.imageUrl }),
    );
  });
});
