import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ArticleEditorialBody from './ArticleEditorialBody.vue';

const meta = {
  title:
    'Chat/AssistantResponse/Templates/ArticleResponse/ArticleEditorialBody',
  component: ArticleEditorialBody,
  tags: ['autodocs'],
  argTypes: {
    summary: { control: 'text' },
    sectionTitle: { control: 'text' },
    sectionContent: { control: 'text' },
    quote: { control: 'text' },
  },
  args: {
    summary: 'A brief summary of the article.',
    sectionTitle: 'Introduction',
    sectionContent: 'Large language models enable new search interfaces.',
    quote: 'The best search is the one you do not notice.',
  },
} satisfies Meta<typeof ArticleEditorialBody>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    summary: undefined,
    sectionTitle: undefined,
    sectionContent: undefined,
    quote: undefined,
  },
};
