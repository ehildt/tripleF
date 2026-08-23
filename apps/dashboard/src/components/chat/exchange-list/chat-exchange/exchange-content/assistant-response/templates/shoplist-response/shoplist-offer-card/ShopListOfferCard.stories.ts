import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ShopListOfferCard from './ShopListOfferCard.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/ShopListResponse/ShopListOfferCard',
  component: ShopListOfferCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
One compact purchase option in the shoplist response: a product image,
concrete info (title, store, rating, delivery, price) and below it a
single direct link to the product page on the shop.
`,
      },
    },
  },
  argTypes: {
    offer: { control: 'object' },
    isBestPrice: { control: 'boolean' },
  },
  args: {
    offer: {
      title: 'Sony WH-1000XM5 - Black',
      price: '€289.00',
      source: 'MediaMarkt',
      imageUrl: 'https://via.placeholder.com/200x200?text=WH-1000XM5',
      delivery: 'In-store pickup available',
      rating: 4.5,
      ratingCount: 3102,
      link: 'https://mediamarkt.com/sony-wh-1000xm5',
    },
    isBestPrice: false,
  },
} satisfies Meta<typeof ShopListOfferCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Standard offer with image, rating, and delivery info. */
export const Default: Story = {};

/** Cheapest offer — marked with the best-price badge. */
export const BestPrice: Story = { args: { isBestPrice: true } };

/** Offer without image, rating, or delivery. */
export const Minimal: Story = {
  args: {
    offer: {
      title: 'Sony WH-1000XM5 - Black',
      price: '€289.00',
      source: 'MediaMarkt',
      link: 'https://mediamarkt.com/sony-wh-1000xm5',
    },
  },
};

/** Offer without a store name — the CTA falls back to a neutral label. */
export const WithoutSource: Story = {
  args: {
    offer: {
      title: 'Sony WH-1000XM5 - Black',
      price: '€289.00',
      link: 'https://example.com/product',
    },
  },
};
