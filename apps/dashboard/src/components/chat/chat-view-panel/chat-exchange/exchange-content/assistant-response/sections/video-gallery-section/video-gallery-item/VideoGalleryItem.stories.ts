import type { Meta, StoryObj } from '@storybook/vue3-vite';

import VideoGalleryItem from './VideoGalleryItem.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/VideoGalleryItem',
  component: VideoGalleryItem,
  tags: ['autodocs'],
  args: {
    item: {
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      caption: 'Rick Astley — official video',
      duration: '3:33',
      channel: 'Rick Astley',
    },
  },
} satisfies Meta<typeof VideoGalleryItem>;

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
