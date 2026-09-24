import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ArticleQuoteSection from './ArticleQuoteSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/ArticleQuoteSection',
  component: ArticleQuoteSection,
  tags: ['autodocs'],
  argTypes: {
    quote: { control: 'text' },
  },
  args: {
    quote: 'A famous quote that inspires thought.',
  },
} satisfies Meta<typeof ArticleQuoteSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { quote: undefined },
};
