import type { Meta, StoryObj } from '@storybook/vue3-vite';

import GallerySection from './GallerySection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/GallerySection',
  component: GallerySection,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    items: { control: 'object' },
  },
  args: {
    title: 'Image(s)',
    items: [
      {
        imageUrl: 'https://via.placeholder.com/300x200?text=1',
        imageAlt: 'One',
      },
      {
        imageUrl: 'https://via.placeholder.com/300x200?text=2',
        imageAlt: 'Two',
      },
    ],
  },
} satisfies Meta<typeof GallerySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Carousel: Story = {};

export const SingleImage: Story = {
  args: {
    items: [
      {
        imageUrl: 'https://via.placeholder.com/300x200?text=S',
        imageAlt: 'Single',
      },
    ],
  },
};

export const Empty: Story = {
  args: { items: [] },
};
