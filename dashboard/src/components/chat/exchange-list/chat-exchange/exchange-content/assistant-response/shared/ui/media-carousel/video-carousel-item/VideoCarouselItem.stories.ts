import type { Meta, StoryObj } from '@storybook/vue3-vite';

import VideoCarouselItem from './VideoCarouselItem.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/AssistantCarousel/VideoCarouselItem',
  component: VideoCarouselItem,
  tags: ['autodocs'],
  args: {
    item: {
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      caption: 'Rick Astley — official video',
    },
  },
} satisfies Meta<typeof VideoCarouselItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutCaption: Story = {
  args: {
    item: {
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
    },
  },
};
