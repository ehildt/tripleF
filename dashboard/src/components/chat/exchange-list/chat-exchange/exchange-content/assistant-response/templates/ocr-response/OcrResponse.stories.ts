import type { Meta, StoryObj } from '@storybook/vue3-vite';

import OcrResponse from './OcrResponse.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/OcrResponse',
  component: OcrResponse,
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object' },
  },
  args: {
    data: {
      title: 'Receipt OCR',
      galleryItems: [
        {
          imageUrl: 'https://via.placeholder.com/300x200',
          imageAlt: 'Receipt',
        },
      ],
      sectionContent: 'Total: $42.00\nDate: 2026-07-01',
      keyFindings: [{ text: 'Readable total' }, { text: 'Date present' }],
    },
  },
} satisfies Meta<typeof OcrResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
