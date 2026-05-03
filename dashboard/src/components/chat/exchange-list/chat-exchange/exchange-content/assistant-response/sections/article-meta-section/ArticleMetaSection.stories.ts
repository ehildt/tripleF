import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ArticleMetaSection from './ArticleMetaSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/ArticleMetaSection',
  component: ArticleMetaSection,
  tags: ['autodocs'],
  argTypes: {
    author: { control: 'text' },
    publishDate: { control: 'text' },
    readTime: { control: 'text' },
  },
  args: {
    author: 'Jane Doe',
    publishDate: '2026-07-01',
    readTime: '5 min read',
  },
} satisfies Meta<typeof ArticleMetaSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {};

export const Partial: Story = {
  args: { author: undefined, readTime: undefined },
};

export const Empty: Story = {
  args: { author: undefined, publishDate: undefined, readTime: undefined },
};
