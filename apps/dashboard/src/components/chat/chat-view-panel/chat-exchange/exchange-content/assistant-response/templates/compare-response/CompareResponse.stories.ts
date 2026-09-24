import type { Meta, StoryObj } from '@storybook/vue3-vite';

import CompareResponse from './CompareResponse.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/CompareResponse',
  component: CompareResponse,
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object' },
  },
  args: {
    data: {
      category: 'Compare',
      title: 'Product A vs Product B',
      galleryItems: [
        {
          imageUrl: 'https://via.placeholder.com/300x200?text=A',
          imageAlt: 'A',
        },
        {
          imageUrl: 'https://via.placeholder.com/300x200?text=B',
          imageAlt: 'B',
        },
      ],
      sectionContent: 'Both products share core features.',
      keyFindings: [
        { text: 'Product A is faster' },
        { text: 'Product B is cheaper' },
      ],
      sources: [{ title: 'Review site', url: 'https://example.com' }],
    },
  },
} satisfies Meta<typeof CompareResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
