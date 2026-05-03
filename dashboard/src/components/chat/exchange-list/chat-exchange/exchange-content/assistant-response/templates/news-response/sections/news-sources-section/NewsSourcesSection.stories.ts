import type { Meta, StoryObj } from '@storybook/vue3-vite';

import NewsSourcesSection from './NewsSourcesSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/NewsSourcesSection',
  component: NewsSourcesSection,
  tags: ['autodocs'],
  argTypes: {
    items: { control: 'object' },
  },
  args: {
    items: [
      {
        title: 'Example News',
        url: 'https://example.com',
        sourceName: 'Example',
        date: '2026-07-11',
        snippet: 'A brief snippet from the source.',
      },
      {
        url: 'https://untitled.example.com',
      },
    ],
  },
} satisfies Meta<typeof NewsSourcesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { items: [] },
};
