import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ShopListResponse from './ShopListResponse.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/ShopListResponse',
  component: ShopListResponse,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Compact product/shop list for follow-up shopping questions about an
already-introduced product. Renders a lean header and a price-sorted
list of purchase options — one product image, concrete info, and one
direct link per offer. No galleries, videos, or review sections.
`,
      },
    },
  },
  argTypes: { data: { control: 'object' } },
  args: {
    data: {
      title: 'Sony WH-1000XM5 Wireless Headphones',
      subtitle: 'Current purchase options',
      shortDescription: 'The MediaMarkt offer dropped €30 since last week.',
      shopOffers: [
        {
          title: 'Sony WH-1000XM5 - Black',
          price: '€289.00',
          source: 'MediaMarkt',
          imageUrl: 'https://via.placeholder.com/200x200?text=WH-1000XM5',
          delivery: 'In-store pickup available',
          rating: 4.5,
          ratingCount: 3102,
          link: 'https://mediamarkt.com/sony-wh-1000xm5',
        },
        {
          title: 'Sony WH-1000XM5 - Silver',
          price: '€299.99',
          source: 'Amazon',
          imageUrl: 'https://via.placeholder.com/200x200?text=WH-1000XM5',
          delivery: 'Free 2-day shipping',
          rating: 4.6,
          ratingCount: 12847,
          link: 'https://amazon.com/sony-wh-1000xm5',
        },
        {
          title: 'WH-1000XM5 Wireless',
          price: '€319.00',
          source: 'Apple Store',
          delivery: 'Standard delivery',
          rating: 4.8,
          ratingCount: 5230,
          link: 'https://apple.com/sony-wh-1000xm5',
        },
      ],
      sources: [
        {
          title: 'Sony WH-1000XM5 product page',
          url: 'https://sony.com/wh-1000xm5',
          sourceName: 'Sony',
        },
      ],
    },
  },
} satisfies Meta<typeof ShopListResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fully populated compact shop list. */
export const Default: Story = {};

/** No data — shows the empty state message. */
export const Empty: Story = { args: { data: {} } };

/** Single offer without image or rating. */
export const SingleOffer: Story = {
  args: {
    data: {
      title: 'Sony WH-1000XM5 Wireless Headphones',
      subtitle: 'Current purchase options',
      shopOffers: [
        {
          title: 'Sony WH-1000XM5 - Black',
          price: '€289.00',
          source: 'MediaMarkt',
          link: 'https://mediamarkt.com/sony-wh-1000xm5',
        },
      ],
    },
  },
};
