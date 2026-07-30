import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ProductSpotlightMedia from './ProductSpotlightMedia.vue';

const meta = {
  title:
    'Chat/AssistantResponse/Templates/ProductResponse/ProductSpotlightHero/Media',
  component: ProductSpotlightMedia,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Main media area of the product spotlight. Renders a hero video via the
shared floating-video figure, or a clickable hero image that emits an
image-clicked event.
`,
      },
    },
  },
  args: {
    videoUrl: undefined,
    videoTitle: undefined,
    videoCaption: undefined,
    selectedSlide: {
      imageUrl: 'https://via.placeholder.com/400x400?text=Hero',
      imageAlt: 'Hero image',
      title: 'Product',
    },
    onTogglePlaylist: fn(),
    onImageClicked: fn(),
  },
} satisfies Meta<typeof ProductSpotlightMedia>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Clickable hero image with caption strip. */
export const Image: Story = {
  args: {
    imageCaption: 'The WH-1000XM5 in black with fold-flat ear cups.',
  },
};

/** Hero video with playlist toggle and caption strip. */
export const Video: Story = {
  args: {
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoTitle: 'Hands-on review',
    videoCaption: 'First impressions after a week of daily use.',
  },
};

/** Empty placeholder when no media is provided. */
export const Empty: Story = {
  args: { selectedSlide: undefined },
};
