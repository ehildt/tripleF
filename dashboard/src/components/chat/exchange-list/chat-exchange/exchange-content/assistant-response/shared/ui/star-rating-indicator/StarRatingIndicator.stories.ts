import type { Meta, StoryObj } from '@storybook/vue3-vite';

import StarRatingIndicator from './StarRatingIndicator.vue';

const meta = {
  title: 'Chat/AssistantResponse/Shared/StarRatingIndicator',
  component: StarRatingIndicator,
  tags: ['autodocs'],
  argTypes: {
    rating: { control: { type: 'range', min: 0, max: 5, step: 0.1 } },
    count: { control: 'text' },
  },
  args: {
    rating: 4.5,
    count: 12847,
  },
} satisfies Meta<typeof StarRatingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full five stars with a review count. */
export const FiveStars: Story = { args: { rating: 5.0, count: 2300 } };

/** Partial fill — three and a half stars. */
export const ThreeHalfStars: Story = { args: { rating: 3.5, count: 487 } };

/** Low rating with rounded down stars. */
export const OneStar: Story = { args: { rating: 1.2 } };

/** Zero rating — no filled stars. */
export const NoStars: Story = { args: { rating: 0, count: 0 } };
