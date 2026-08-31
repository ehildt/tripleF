import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import AttachmentGallery from './AttachmentGallery.vue';

const meta = {
  title: 'Chat/RightPanel/AttachmentGallery',
  component: AttachmentGallery,
  tags: ['autodocs'],
  args: {
    urlForHash: (hash: string) => `https://picsum.photos/seed/${hash}/400`,
    onToggle: fn(),
    onRemove: fn(),
    onRemovePage: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          'One pdf in the Files panel: the image-card header (name, include/exclude toggle, remove-all) above a grid of page thumbnails. Clicking a thumbnail opens the pdf lightbox; the corner ✕ drops that single page.',
      },
    },
  },
} satisfies Meta<typeof AttachmentGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A three-page pdf with every page selected. */
export const MultiPage: Story = {
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

/** A single-page pdf. */
export const SinglePage: Story = {
  args: {
    item: {
      ...MultiPage.args!.item!,
      name: 'memo.pdf',
      pages: [{ name: 'memo.pdf · page 1', hash: 'm1' }],
    },
  },
};

/** The whole pdf excluded from the query (dimmed, grayscale). */
export const Excluded: Story = {
  args: {
    item: {
      ...MultiPage.args!.item!,
      isSelected: false,
    },
  },
};
