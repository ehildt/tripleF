import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import AttachmentCard from './AttachmentCard.vue';

const meta = {
  title: 'Chat/RightPanel/AttachmentCard',
  component: AttachmentCard,
  tags: ['autodocs'],
  args: {
    imageSrc: '',
    urlForHash: (hash: string) => `https://picsum.photos/seed/${hash}/400`,
    onRemove: fn(),
    onToggle: fn(),
    onRemovePage: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          'One attachment tile in the Files panel, dispatched by kind: an image card, a pdf page gallery, or a document row (playlist style).',
      },
    },
  },
} satisfies Meta<typeof AttachmentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An image attachment with a thumbnail. */
export const Image: Story = {
  args: {
    item: {
      id: 'pending-1',
      name: 'screenshot.png',
      hash: 'h1',
      previewUrl: '',
      isUploaded: false,
      isSelected: true,
      pendingIndex: 0,
      source: 'local',
      kind: 'image',
    },
    imageSrc:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
  },
};

/** A pdf attachment rendered as a page gallery. */
export const PdfGallery: Story = {
  args: {
    item: {
      id: 'gallery-doc',
      name: 'report.pdf',
      hash: 'doc-hash',
      previewUrl: '',
      isUploaded: true,
      isSelected: true,
      pendingIndex: null,
      source: 'local',
      kind: 'gallery',
      pages: [
        { name: 'report.pdf · page 1', hash: 'p1' },
        { name: 'report.pdf · page 2', hash: 'p2' },
        { name: 'report.pdf · page 3', hash: 'p3' },
      ],
    },
  },
};

/** A non-pdf document rendered as a playlist-style row. */
export const Document: Story = {
  args: {
    item: {
      id: 'uploaded-document-h2',
      name: 'notes.txt',
      hash: 'h2',
      previewUrl: '',
      isUploaded: true,
      isSelected: true,
      pendingIndex: null,
      source: 'local',
      kind: 'document',
      size: 1536,
    },
  },
};

/** An excluded attachment (dimmed, grayscale). */
export const Unselected: Story = {
  args: {
    item: {
      id: 'uploaded-h3',
      name: 'diagram.png',
      hash: 'h3',
      previewUrl: '',
      isUploaded: true,
      isSelected: false,
      pendingIndex: null,
      source: 'local',
      kind: 'image',
    },
    imageSrc: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400',
  },
};
