import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import DocumentPreview from './DocumentPreview.vue';

const meta = {
  title: 'Chat/DocumentPreview/DocumentPreview',
  component: DocumentPreview,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    isLoading: false,
    error: null,
    html: null,
    text: null,
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          'Modal that renders an attached document: sanitized HTML (docx), slide text (pptx) or the raw text. PDFs render as page-image tiles elsewhere — they never open here.',
      },
    },
  },
} satisfies Meta<typeof DocumentPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A docx rendered as HTML. */
export const DocumentHtml: Story = {
  args: {
    item: { name: 'report.docx', url: 'blob://report' },
    html: '<h1>Report</h1><p>Numbers are up.</p>',
  },
};

/** Plain-text document. */
export const DocumentText: Story = {
  args: {
    item: { name: 'notes.txt', url: 'blob://notes' },
    text: 'hello world',
  },
};
