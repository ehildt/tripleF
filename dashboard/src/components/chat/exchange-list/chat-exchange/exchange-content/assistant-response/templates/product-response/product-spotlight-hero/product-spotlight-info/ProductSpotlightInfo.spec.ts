import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ProductSpotlightInfo from './ProductSpotlightInfo.vue';

describe('ProductSpotlightInfo', () => {
  it('renders title, eyebrow and price', () => {
    const wrapper = mount(ProductSpotlightInfo, {
      props: {
        category: 'Tech',
        title: 'Sony WH-1000XM5',
        ratingLabel: 'Excellent',
        priceRange: '€289.00 – €319.00',
        offerCount: 3,
      },
    });
    expect(wrapper.text()).toContain('Sony WH-1000XM5');
    expect(wrapper.text()).toContain('Tech');
    expect(wrapper.text()).toContain('€289.00');
  });

  it('renders the rating block when rating is provided', () => {
    const wrapper = mount(ProductSpotlightInfo, {
      props: { title: 'X', rating: 4.5, ratingCount: 1234 },
    });
    expect(wrapper.find('.spotlight__rating').exists()).toBe(true);
    expect(wrapper.text()).toContain('4.5');
    expect(wrapper.text()).toContain('1,234 reviews');
  });

  it('renders the CTA when a best offer is provided', () => {
    const wrapper = mount(ProductSpotlightInfo, {
      props: {
        title: 'X',
        bestOffer: {
          source: 'MediaMarkt',
          price: '€289.00',
          link: 'https://example.com',
        },
      },
    });
    const cta = wrapper.find('.spotlight__cta');
    expect(cta.exists()).toBe(true);
    expect(cta.attributes('href')).toBe('https://example.com');
    expect(cta.text()).toContain('MediaMarkt');
  });

  it('does not render a CTA when no offer link is provided', () => {
    const wrapper = mount(ProductSpotlightInfo, {
      props: { title: 'X' },
    });
    expect(wrapper.find('.spotlight__cta').exists()).toBe(false);
  });
});
