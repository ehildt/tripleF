import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ProductReviewsSection from './ProductReviewsSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/Product/ProductReviewsSection',
  component: ProductReviewsSection,
  tags: ['autodocs'],
  argTypes: { reviews: { control: 'object' } },
  args: {
    reviews: [
      {
        text: 'Exceptional noise cancellation rivals Bose QuietComfort Ultra.',
      },
      { text: 'Battery life exceeds the stated 30-hour claim with ANC on.' },
      {
        text: 'Build quality is premium but some find the clamp force a little tight.',
      },
    ],
  },
} satisfies Meta<typeof ProductReviewsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
