import type { Meta, StoryObj } from '@storybook/vue3-vite';

import CarouselContent from './CarouselContent.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/AssistantCarousel/CarouselContent',
  component: CarouselContent,
  tags: ['autodocs'],
  argTypes: {
    items: { control: 'object' },
    activeIndex: { control: { type: 'range', min: 0, max: 4 } },
  },
  args: {
    activeIndex: 1,
    items: [
      {
        imageUrl: 'https://via.placeholder.com/300x200?text=1',
        imageAlt: 'One',
      },
      {
        imageUrl: 'https://via.placeholder.com/300x200?text=2',
        imageAlt: 'Two',
      },
      {
        imageUrl: 'https://via.placeholder.com/300x200?text=3',
        imageAlt: 'Three',
      },
    ],
  },
} satisfies Meta<typeof CarouselContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three slides with the middle one active. */
export const ThreeImages: Story = {};

/** Two slides use the peek layout (count-2). */
export const TwoImages: Story = {
  args: {
    items: [
      { imageUrl: 'https://via.placeholder.com/300x200?text=A', imageAlt: 'A' },
      { imageUrl: 'https://via.placeholder.com/300x200?text=B', imageAlt: 'B' },
    ],
  },
};

/** First slide active — the prev button is disabled. */
export const FirstActive: Story = { args: { activeIndex: 0 } };

/** Last slide active — the next button is disabled. */
export const LastActive: Story = { args: { activeIndex: 2 } };
