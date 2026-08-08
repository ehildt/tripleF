import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import ProductBanner from './ProductBanner.vue';

const baseProps = {
  title: 'Sony WH-1000XM5 Wireless Headphones',
  subtitle: 'Premium noise-cancelling headphones',
  imageUrl: 'https://example.com/hero.jpg',
  imageAlt: 'Hero',
  imageCaption: 'Sony WH-1000XM5 in black',
  rating: 4.6,
  ratingCount: 12847,
  ratingLabel: 'Excellent',
};

describe('ProductBanner', () => {
  it('renders title and subtitle', () => {
    const wrapper = mount(ProductBanner, { props: baseProps });
    expect(wrapper.find('.product-banner__title').text()).toContain(
      'Sony WH-1000XM5',
    );
    expect(wrapper.find('.product-banner__subtitle').text()).toContain(
      'Premium noise-cancelling',
    );
  });

  it('renders the always-visible rating overlay', () => {
    const wrapper = mount(ProductBanner, { props: baseProps });
    const rating = wrapper.find('.product-banner__rating');
    expect(rating.exists()).toBe(true);
    expect(wrapper.text()).toContain('4.6');
    expect(wrapper.text()).toContain('12,847 reviews');
    expect(wrapper.text()).toContain('Excellent');
  });

  it('does not render the rating overlay when no rating is provided', () => {
    const wrapper = mount(ProductBanner, {
      props: { ...baseProps, rating: undefined, ratingCount: undefined },
    });
    expect(wrapper.find('.product-banner__rating').exists()).toBe(false);
  });

  it('renders the caption below the image', () => {
    const wrapper = mount(ProductBanner, { props: baseProps });
    expect(wrapper.find('.product-banner__caption').text()).toContain(
      'Sony WH-1000XM5 in black',
    );
  });

  it('emits image click via injected handler', async () => {
    const handler = vi.fn();
    const wrapper = mount(ProductBanner, {
      props: baseProps,
      global: { provide: { [harnessImageClickedKey]: handler } },
    });
    await wrapper.find('.product-banner__trigger').trigger('click');
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrl: baseProps.imageUrl }),
    );
  });

  it('renders a placeholder when there is no image', () => {
    const wrapper = mount(ProductBanner, {
      props: { ...baseProps, imageUrl: undefined },
    });
    expect(wrapper.find('.product-banner__placeholder').exists()).toBe(true);
  });

  it('renders the glassy +N count badge when imageCount is set', () => {
    const wrapper = mount(ProductBanner, {
      props: { ...baseProps, imageCount: 4 },
    });
    const badge = wrapper.find('.product-banner__count');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('+4');
  });

  it('hides the +N badge when imageCount is missing or zero', () => {
    const without = mount(ProductBanner, { props: baseProps });
    expect(without.find('.product-banner__count').exists()).toBe(false);

    const zero = mount(ProductBanner, {
      props: { ...baseProps, imageCount: 0 },
    });
    expect(zero.find('.product-banner__count').exists()).toBe(false);
  });
});
