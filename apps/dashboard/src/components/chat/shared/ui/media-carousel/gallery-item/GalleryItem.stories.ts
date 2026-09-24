import type { Meta, StoryObj } from '@storybook/vue3-vite';

import GalleryItem from './GalleryItem.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/GalleryItem',
  component: GalleryItem,
  tags: ['autodocs'],
  argTypes: {
    item: { control: 'object' },
  },
  args: {
    item: {
      imageUrl: 'https://via.placeholder.com/300x200',
      imageAlt: 'Sample photo',
      title: 'Sample title',
      caption: 'A short caption',
    },
  },
} satisfies Meta<typeof GalleryItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TitleEqualsCaption: Story = {
  args: {
    item: {
      imageUrl: 'https://via.placeholder.com/300x200',
      title: 'Same',
      caption: 'Same',
    },
  },
};

export const NoMetadata: Story = {
  args: {
    item: {
      imageUrl: 'https://via.placeholder.com/300x200',
    },
  },
};
