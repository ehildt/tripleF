import type { Meta, StoryObj } from '@storybook/vue3-vite';

import DescribeResponse from './DescribeResponse.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/DescribeResponse',
  component: DescribeResponse,
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object' },
  },
  args: {
    data: {
      category: 'Vision',
      title: 'Mountain Lake',
      subtitle: 'A serene alpine scene',
      galleryItems: [
        {
          imageUrl: 'https://via.placeholder.com/300x200',
          imageAlt: 'Lake',
          title: 'Lake',
          caption: 'Crystal clear water',
        },
      ],
      sectionContent: 'A wide mountain lake surrounded by pine trees.',
      keyFindings: [{ text: 'High elevation' }, { text: 'Calm surface' }],
      sources: [{ title: 'Geography.com', url: 'https://example.com' }],
    },
  },
} satisfies Meta<typeof DescribeResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Minimal: Story = {
  args: { data: { title: 'Minimal' } },
};
