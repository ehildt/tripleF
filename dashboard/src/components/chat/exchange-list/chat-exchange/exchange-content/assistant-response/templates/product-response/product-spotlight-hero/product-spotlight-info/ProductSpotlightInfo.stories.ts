import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ProductSpotlightInfo from './ProductSpotlightInfo.vue';

const meta = {
  title:
    'Chat/AssistantResponse/Templates/ProductResponse/ProductSpotlightHero/Info',
  component: ProductSpotlightInfo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Decision column of the product spotlight: category/rating label, title,
subtitle, rating, price, short description, buy advice and CTA.
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
} satisfies Meta<typeof ProductSpotlightInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fully populated info column. */
export const Default: Story = {};

/** Title only. */
export const Minimal: Story = {
  args: {
    category: undefined,
    subtitle: undefined,
    description: undefined,
    rating: undefined,
    ratingCount: undefined,
    ratingLabel: undefined,
    priceRange: undefined,
    offerCount: undefined,
    buyAdvice: undefined,
    bestOffer: undefined,
  },
};
