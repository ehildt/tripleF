import type { Meta, StoryObj } from '@storybook/vue3-vite';

import MediaImageCard from './MediaImageCard.vue';

const meta = {
  title: 'Shared/Media/MediaImageCard',
  component: MediaImageCard,
  tags: ['autodocs'],
  argTypes: {
    imageUrl: { control: 'text' },
    imageAlt: { control: 'text' },
    title: { control: 'text' },
    caption: { control: 'text' },
  },
  args: {
    imageUrl: 'https://via.placeholder.com/1280x720',
    imageAlt: 'Sample image',
  },
} satisfies Meta<typeof MediaImageCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default hero image card; shows a pulse skeleton until the image loads. */
export const Default: Story = {};

/** With title and caption metadata. */
export const WithMetadata: Story = {
  args: {
    imageUrl: 'https://via.placeholder.com/1280x720',
    imageAlt: 'Sample image',
    title: 'A title',
    caption: 'A short caption',
  },
};
