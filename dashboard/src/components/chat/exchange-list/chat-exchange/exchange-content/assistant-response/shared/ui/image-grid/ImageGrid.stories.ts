import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ImageGrid from './ImageGrid.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/ImageGrid',
  component: ImageGrid,
  tags: ['autodocs'],
  argTypes: {
    items: { control: 'object' },
  },
  args: {
    items: [
      {
        imageUrl: 'https://via.placeholder.com/640x360?text=1',
        imageAlt: 'One',
        title: 'Sample title',
        caption: 'A short caption',
        width: 640,
        height: 360,
        source: 'example.com',
      },
      {
        imageUrl: 'https://via.placeholder.com/640x360?text=2',
        imageAlt: 'Two',
      },
      {
        imageUrl: 'https://via.placeholder.com/640x360?text=3',
        imageAlt: 'Three',
      },
    ],
  },
} satisfies Meta<typeof ImageGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default responsive tile grid. */
export const Default: Story = {};

/** A single tile. */
export const Single: Story = {
  args: {
    items: [
      {
        imageUrl: 'https://via.placeholder.com/640x360?text=S',
        imageAlt: 'Single',
      },
    ],
  },
};
