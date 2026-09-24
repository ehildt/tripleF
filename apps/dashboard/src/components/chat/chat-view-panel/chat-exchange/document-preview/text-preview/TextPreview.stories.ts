import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TextPreview from './TextPreview.vue';

const meta = {
  title: 'Chat/DocumentPreview/TextPreview',
  component: TextPreview,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Renders a text document inside the preview: sanitized HTML (docx/markdown) or preformatted text.',
      },
    },
  },
} satisfies Meta<typeof TextPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A docx converted to HTML. */
export const Html: Story = {
  args: {
    name: 'report.docx',
    html: '<h1>Report</h1><p>Quarterly numbers are <b>up</b>.</p>',
  },
};

/** A markdown file rendered through markdown-it. */
export const Markdown: Story = {
  args: {
    name: 'guide.md',
    text: '# Guide\n\n- one\n- two',
  },
};

/** A plain text file. */
export const PlainText: Story = {
  args: {
    name: 'notes.txt',
    text: 'hello world\nsecond line',
  },
};
