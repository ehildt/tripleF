import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ProductBanner from './ProductBanner.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/ProductResponse/ProductBanner',
  component: ProductBanner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Full-width product banner for the product response template. Shows a
detailed product image with an always-visible rating overlay (stars,
value, count, verdict) pinned to the bottom of the image. Title,
subtitle and category sit above; an optional caption sits below.
Clicking the image opens the lightbox.
`,
      },
    },
  },
  args: {
    category: 'Tech',
    title: 'Sony WH-1000XM5 Wireless Headphones',
    subtitle: 'Premium noise-cancelling over-ear headphones',
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
    imageAlt: 'Hero image',
    imageCaption: 'Sony WH-1000XM5 in black',
    rating: 4.6,
    ratingCount: 12847,
    ratingLabel: 'Excellent',
  },
} satisfies Meta<typeof ProductBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default banner with image and rating overlay. */
export const Default: Story = {};

/** Banner without a rating. */
export const NoRating: Story = {
  args: {
    rating: undefined,
    ratingCount: undefined,
    ratingLabel: undefined,
  },
};

/** Minimal banner with only a title. */
export const Minimal: Story = {
  args: {
    category: undefined,
    subtitle: undefined,
    imageUrl: undefined,
    imageAlt: undefined,
    imageCaption: undefined,
    rating: undefined,
    ratingCount: undefined,
    ratingLabel: undefined,
  },
};
