import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ShopOffersSection from './ShopOffersSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/Product/ShopOffersSection',
  component: ShopOffersSection,
  tags: ['autodocs'],
  argTypes: { offers: { control: 'object' } },
  args: {
    offers: [
      {
        title: 'Sony WH-1000XM5 - Black',
        price: '€299.99',
        source: 'Amazon',
        delivery: 'Free 2-day shipping',
        rating: 4.6,
        ratingCount: 12847,
        link: 'https://amazon.com/example',
      },
      {
        title: 'WH-1000XM5 Wireless',
        price: '€319.00',
        source: 'Apple Store',
        delivery: 'Standard delivery',
        rating: 4.8,
        ratingCount: 5230,
        link: 'https://apple.com/example',
      },
      {
        title: 'Sony Premium Headphones',
        price: '€289.00',
        source: 'MediaMarkt',
        delivery: 'In-store pickup available',
        rating: 4.5,
        ratingCount: 3102,
        link: 'https://mediamarkt.com/example',
      },
    ],
  },
} satisfies Meta<typeof ShopOffersSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeOffers: Story = {};

export const SingleOffer: Story = {
  args: {
    offers: [
      {
        title: 'Only Available Here',
        price: '€199.00',
        source: 'Direct Store',
        link: 'https://direct.com',
      },
    ],
  },
};

export const Empty: Story = { args: { offers: [] } };
