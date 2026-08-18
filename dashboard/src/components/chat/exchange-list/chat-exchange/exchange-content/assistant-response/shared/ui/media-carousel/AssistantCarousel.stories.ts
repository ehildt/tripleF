import type { Meta, StoryObj } from '@storybook/vue3-vite';

import AssistantCarousel from './AssistantCarousel.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/AssistantCarousel',
  component: AssistantCarousel,
  tags: ['autodocs'],
  argTypes: {
    items: { control: 'object' },
  },
  args: {
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
} satisfies Meta<typeof AssistantCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeImages: Story = {};

export const TwoImages: Story = {
  args: {
    items: [
      { imageUrl: 'https://via.placeholder.com/300x200?text=A', imageAlt: 'A' },
      { imageUrl: 'https://via.placeholder.com/300x200?text=B', imageAlt: 'B' },
    ],
  },
};

/** Video slides render in the same carousel chrome. */
export const Videos: Story = {
  args: {
    items: [
      {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Never Gonna Give You Up',
        caption: 'Rick Astley — official video',
      },
      {
        videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        title: 'Me at the zoo',
      },
    ],
  },
};
