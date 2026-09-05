import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import AttachmentDocumentRow from './AttachmentDocumentRow.vue';

const meta = {
  title: 'Chat/RightPanel/AttachmentDocumentRow',
  component: AttachmentDocumentRow,
  tags: ['autodocs'],
  args: {
    onToggle: fn(),
    onRemove: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          'One non-pdf document in the Files panel, styled like a playlist row: file name and size with an include/exclude toggle and a remove button. Documents carry no rendered content, so the row shows no preview and opens no lightbox.',
      },
    },
  },
} satisfies Meta<typeof AttachmentDocumentRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A selected document row. */
export const Document: Story = {
  args: {
    item: {
      id: 'uploaded-document-h1',
      name: 'notes.txt',
      hash: 'h1',
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

/** A document excluded from the query (dimmed). */
export const Excluded: Story = {
  args: {
    item: {
      ...Document.args!.item!,
      isSelected: false,
    },
  },
};
