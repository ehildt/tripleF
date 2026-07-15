import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ShopOfferCard from './ShopOfferCard.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/Product/ShopOfferCard',
  component: ShopOfferCard,
  tags: ['autodocs'],
  argTypes: { offer: { control: 'object' } },
  args: {
    offer: {
      title: 'Sony WH-1000XM5 Wireless Headphones',
      price: '€299.99',
      source: 'Amazon',
      delivery: 'Free 2-day shipping',
      rating: 4.6,
      ratingCount: 12847,
      link: 'https://amazon.com/example',
    },
  },
} satisfies Meta<typeof ShopOfferCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Offer with all fields including star rating and delivery info. */
export const FullData: Story = {};

/** Minimal offer — title, price, source, link only. */
export const Minimal: Story = {
  args: {
    offer: {
      title: 'Some Product',
      price: '€19.00',
      source: 'Example Store',
      link: 'https://example.com',
    },
  },
};

/** Offer with very long product name to test truncation. */
export const LongProductName: Story = {
  args: {
    offer: {
      title:
        "Sony's Latest Flagship Wireless Noise Cancelling Headphones with Adaptive Sound Control and Speak-to-Chat Technology WH-1000XM5 Black Edition",
      price: '€329.00',
      source: 'MediaMarkt',
      delivery: 'In-store pickup available',
      rating: 4.8,
      ratingCount: 2100,
      link: 'https://mediamarkt.com/example-long-name',
    },
  },
};
