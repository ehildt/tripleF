import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import AttachmentCard from './AttachmentCard.vue';

const meta = {
  title: 'Chat/RightPanel/AttachmentCard',
  component: AttachmentCard,
  tags: ['autodocs'],
  args: {
    imageSrc: '',
    onRemove: fn(),
    onToggle: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          'One file card in the Files panel: name header with include/exclude toggle and remove button, above a thumbnail (image) or an icon tile (document).',
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

/** A document attachment rendered as an icon tile. */
export const Document: Story = {
  args: {
    item: {
      id: 'pending-2',
      name: 'report.docx',
      hash: 'h2',
      previewUrl: '',
      isUploaded: false,
      isSelected: true,
      pendingIndex: 1,
      source: 'local',
      kind: 'document',
    },
  },
};

/** An excluded attachment (dimmed, grayscale). */
export const Unselected: Story = {
  args: {
    item: {
      id: 'pending-3',
      name: 'notes.txt',
      hash: 'h3',
      previewUrl: '',
      isUploaded: false,
      isSelected: false,
      pendingIndex: 2,
      source: 'local',
      kind: 'document',
    },
  },
};
