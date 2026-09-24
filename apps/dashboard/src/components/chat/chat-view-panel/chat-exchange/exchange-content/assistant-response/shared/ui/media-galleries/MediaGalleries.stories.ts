import type { Meta, StoryObj } from '@storybook/vue3-vite';

import MediaGalleries from './MediaGalleries.vue';

const meta = {
  title: 'Chat/AssistantResponse/Shared/UI/MediaGalleries',
  component: MediaGalleries,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The video + image gallery pair in the app-level order (\`videosFirst\`).
A fragment — no wrapper box — so the parent's gap keeps spacing sections.
`,
      },
    },
  },
  argTypes: {
    videosFirst: { control: 'boolean' },
    galleryTitle: { control: 'text' },
    videoGalleryTitle: { control: 'text' },
    mosaic: { control: 'boolean' },
  },
  args: {
    videosFirst: false,
    galleryTitle: 'Gallery',
    videoGalleryTitle: 'Videos',
    galleryItems: [
      { imageUrl: 'https://picsum.photos/seed/g1/640/360', imageAlt: 'One' },
      { imageUrl: 'https://picsum.photos/seed/g2/640/360', imageAlt: 'Two' },
    ],
    videoGalleryItems: [
      {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'A video',
      },
    ],
  },
} satisfies Meta<typeof MediaGalleries>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Images first (default media priority). */
export const ImagesFirst: Story = {};

/** Videos first. */
export const VideosFirst: Story = { args: { videosFirst: true } };

/** Dense mosaic gallery (ar4). */
export const MosaicGallery: Story = { args: { mosaic: true } };
