import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ProductSpotlightHero from './ProductSpotlightHero.vue';

const meta = {
  title:
    'Chat/AssistantResponse/Templates/ProductResponse/ProductSpotlightHero',
  component: ProductSpotlightHero,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Editorial product hero for the product response template. Composes a
media viewer (image or video) and an info/decision column with rating,
price and CTA. Clicking the hero image opens the lightbox with every
product image.
`,
      },
    },
  },
  args: {
    category: 'Tech',
    title: 'Sony WH-1000XM5 Wireless Headphones',
    subtitle: 'Premium noise-cancelling over-ear headphones',
    description:
      'Industry-leading noise cancellation with 30 hours of battery life.',
    imageUrl: 'https://via.placeholder.com/400x400?text=Hero',
    imageAlt: 'Hero image',
    rating: 4.6,
    ratingCount: 12847,
    ratingLabel: 'Excellent',
    priceRange: '€289.00 – €319.00',
    offerCount: 3,
    buyAdvice:
      'Best deal: MediaMarkt at €289.00 with in-store pickup — €30 below the next offer.',
    bestOffer: {
      source: 'MediaMarkt',
      price: '€289.00',
      link: 'https://example.com',
    },
  },
} satisfies Meta<typeof ProductSpotlightHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default image hero with CTA. */
export const Default: Story = {};

/** Hero with a video. */
export const VideoHero: Story = {
  args: {
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoTitle: 'Hands-on review',
    videoCaption: 'Watch the full hands-on review',
  },
};

/** Minimal hero with only a title. */
export const Minimal: Story = {
  args: {
    category: undefined,
    subtitle: undefined,
    description: undefined,
    imageUrl: undefined,
    imageAlt: undefined,
    rating: undefined,
    ratingCount: undefined,
    ratingLabel: undefined,
    priceRange: undefined,
    offerCount: undefined,
    buyAdvice: undefined,
    bestOffer: undefined,
  },
};
