import type { Meta, StoryObj } from '@storybook/vue3-vite';

import FloatingVideoFigure from './FloatingVideoFigure.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/FloatingVideoFigure',
  component: FloatingVideoFigure,
  tags: ['autodocs'],
  argTypes: {
    videoUrl: { control: 'text' },
    title: { control: 'text' },
    posterUrl: { control: 'text' },
  },
  args: {
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Sample video',
    posterUrl: 'https://via.placeholder.com/1280x720',
  },
} satisfies Meta<typeof FloatingVideoFigure>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A video figure with a poster; clicking it launches the floating player. */
export const Default: Story = {};

/** A video without a poster image — the media box shows without a skeleton. */
export const NoPoster: Story = {
  args: {
    posterUrl: null,
  },
};

/** An unembeddable URL degrades to an external link. */
export const Unembeddable: Story = {
  args: {
    videoUrl: 'https://example.com/video.mp4',
  },
};
