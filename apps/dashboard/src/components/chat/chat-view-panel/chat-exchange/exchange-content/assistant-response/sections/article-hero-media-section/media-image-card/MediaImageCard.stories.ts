import type { Meta, StoryObj } from '@storybook/vue3-vite';

import MediaImageCard from './MediaImageCard.vue';

const meta = {
  title: 'Chat/View Panel/Article Hero Media Section/Media Image Card',
  component: MediaImageCard,
  tags: ['autodocs'],
  argTypes: {
    imageUrl: { control: 'text' },
    imageAlt: { control: 'text' },
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
