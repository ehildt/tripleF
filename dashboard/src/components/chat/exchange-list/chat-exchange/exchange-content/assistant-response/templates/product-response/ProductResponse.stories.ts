import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ProductResponse from './ProductResponse.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/ProductResponse',
  component: ProductResponse,
  tags: ['autodocs'],
  argTypes: { data: { control: 'object' } },
  args: {
    data: {
      category: 'Tech',
      title: 'Sony WH-1000XM5 Wireless Headphones',
      subtitle: 'Premium noise-cancelling over-ear headphones',
      shortDescription:
        'The Sony WH-1000XM5 delivers industry-leading noise cancellation with 30 hours of battery life. A top-tier choice for commuters and audiophiles.',
      heroImageUrl:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
      heroImageAlt: 'Sony WH-1000XM5 headphones',
      aggregateRating: 4.6,
      aggregateRatingCount: 12847,
      aggregateRatingLabel: 'Excellent',
      keyPoints: [
        { text: 'Industry-leading noise cancellation' },
        { text: '30-hour battery life with quick charge' },
        { text: 'Crystal-clear hands-free calling with 4 beamforming mics' },
        { text: 'Ultra-comfortable lightweight design at 250g' },
      ],
      pros: [
        { text: 'Best-in-class noise cancellation' },
        { text: 'Outstanding battery life' },
        { text: 'Very comfortable for long sessions' },
      ],
      cons: [
        { text: 'No water resistance rating' },
        { text: 'Clamp force can feel tight at first' },
      ],
      shopOffers: [
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
      videoGalleryItems: [
        {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Hands-on Review',
        },
        {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Unboxing',
        },
        {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Long-term Test',
        },
      ],
      sources: [
        {
          title: 'RTINGS Full Review',
          url: 'https://example.com/rtings-sony-xm5',
          sourceName: 'RTINGS',
        },
      ],
    },
  },
} satisfies Meta<typeof ProductResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fully populated product response with banner, specs, videos, and offers. */
export const Default: Story = {};

/** No data — shows the empty state message. */
export const Empty: Story = { args: { data: {} } };

/** Product with only title and a few specs (no image or offers). */
export const MinimalData: Story = {
  args: {
    data: {
      category: 'Product',
      title: 'Unknown Widget',
      shortDescription: 'No search results returned for this product.',
      keyPoints: [{ text: 'Availability unknown' }],
    },
  },
};
