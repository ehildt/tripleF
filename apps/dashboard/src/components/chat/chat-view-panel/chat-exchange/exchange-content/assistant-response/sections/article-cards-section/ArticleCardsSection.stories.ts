import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ArticleCardsSection from './ArticleCardsSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/ArticleCardsSection',
  component: ArticleCardsSection,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    items: { control: 'object' },
  },
  args: {
    title: 'Related Cards',
    items: [
      {
        title: 'Card One',
        description: 'Description for the first card.',
        url: 'https://example.com/one',
      },
      {
        title: 'Card Two',
        description: 'Description for the second card.',
        url: 'https://example.com/two',
        linkLabel: 'Learn more',
      },
    ],
  },
} satisfies Meta<typeof ArticleCardsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { items: [] },
};
