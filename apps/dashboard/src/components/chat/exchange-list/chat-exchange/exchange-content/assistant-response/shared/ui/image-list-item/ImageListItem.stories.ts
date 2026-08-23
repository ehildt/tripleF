import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ImageListItem from './ImageListItem.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/ImageListItem',
  component: ImageListItem,
  tags: ['autodocs'],
  argTypes: {
    item: { control: 'object' },
  },
  args: {
    item: {
      imageUrl: 'https://via.placeholder.com/640x360',
      imageAlt: 'Sample photo',
      title: 'Sample title',
      caption: 'A short caption',
      width: 640,
      height: 360,
      source: 'example.com',
    },
  },
} satisfies Meta<typeof ImageListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One tile of the image grid with its dimensions badge and hover overlay. */
export const Default: Story = {};

/** Tile without dimensions — the badge is omitted. */
export const NoDimensions: Story = {
  args: {
    item: {
      imageUrl: 'https://via.placeholder.com/640x360',
      imageAlt: 'Sample photo',
    },
  },
};
