import type { Meta, StoryObj } from '@storybook/vue3-vite';

import AssistantResponse from './AssistantResponse.vue';

const meta = {
  title: 'Chat/AssistantResponse/AssistantResponse',
  component: AssistantResponse,
  tags: ['autodocs'],
  argTypes: {
    template: {
      control: 'select',
      options: ['text', 'describe', 'compare', 'ocr', 'article', 'news'],
    },
    data: { control: 'object' },
    text: { control: 'text' },
  },
  args: {
    template: 'describe',
    data: {
      title: 'Sample Describe',
      sectionContent: 'A sample description.',
    },
    text: undefined,
  },
} satisfies Meta<typeof AssistantResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Describe: Story = {};

export const Text: Story = {
  args: { template: 'text', text: 'Streaming text response.' },
};

export const Compare: Story = {
  args: {
    template: 'compare',
    data: { title: 'Compare', sectionContent: 'Comparison text' },
  },
};

export const Ocr: Story = {
  args: {
    template: 'ocr',
    data: { title: 'OCR', sectionContent: 'Extracted text' },
  },
};

export const News: Story = {
  args: {
    template: 'news',
    data: { headline: 'News Headline', lead: 'News lead.' },
  },
};

export const Article: Story = {
  args: {
    template: 'article',
    data: {
      title: 'Article',
      sectionContent: 'Article body',
    },
  },
};
