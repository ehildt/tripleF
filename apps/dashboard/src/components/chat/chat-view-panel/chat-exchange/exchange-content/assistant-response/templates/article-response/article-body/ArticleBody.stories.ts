import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ArticleBody from './ArticleBody.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/ArticleResponse/ArticleBody',
  component: ArticleBody,
  tags: ['autodocs'],
  argTypes: {
    showLead: { control: 'boolean' },
    summary: { control: 'text' },
    sectionTitle: { control: 'text' },
    sectionContent: { control: 'text' },
    quote: { control: 'text' },
    multicol: { control: 'boolean' },
  },
  args: {
    showLead: true,
    summary: 'A brief summary of the article.',
    sectionTitle: 'Introduction',
    sectionContent: 'Large language models enable new search interfaces.',
    quote: 'The best search is the one you do not notice.',
    multicol: false,
  },
} satisfies Meta<typeof ArticleBody>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NewspaperColumns: Story = {
  args: { multicol: true },
};

export const NoLead: Story = {
  args: { showLead: false },
};
