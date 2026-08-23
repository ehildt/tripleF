import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ArticleLeadSection from './ArticleLeadSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/ArticleLeadSection',
  component: ArticleLeadSection,
  tags: ['autodocs'],
  argTypes: {
    summary: { control: 'text' },
  },
  args: {
    summary: 'This is the article lead or summary paragraph.',
  },
} satisfies Meta<typeof ArticleLeadSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { summary: undefined },
};
