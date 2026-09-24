import type { Meta, StoryObj } from '@storybook/vue3-vite';

import RelatedStoriesSection from './RelatedStoriesSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/RelatedStoriesSection',
  component: RelatedStoriesSection,
  tags: ['autodocs'],
  argTypes: {
    items: { control: 'object' },
  },
  args: {
    items: [
      {
        title: 'Global Markets React to Inflation Report',
        url: 'https://example.com/markets',
        sourceName: 'Reuters',
        date: '2026-07-11',
        imageUrl:
          'https://images.unsplash.com/photo-1611974765270-ca1258634369?w=640',
      },
      {
        title: 'Tech Sector Sees Renewed Volatility',
        url: 'https://example.org/tech',
        sourceName: 'Bloomberg',
        date: '2026-07-10',
        imageUrl:
          'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=640',
      },
      {
        title: 'Energy Prices Climb on Supply Concerns',
        url: 'https://example.net/energy',
        sourceName: 'Financial Times',
        date: '2026-07-09',
        imageUrl:
          'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=640',
      },
      {
        title: 'Another story without source metadata',
        url: 'https://example.org/no-meta',
      },
    ],
  },
} satisfies Meta<typeof RelatedStoriesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Single: Story = {
  args: {
    items: [
      {
        title: 'Single Featured Story',
        url: 'https://example.com/single',
        sourceName: 'Featured Source',
        date: '2026-07-11',
        imageUrl:
          'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=640',
      },
    ],
  },
};

export const Empty: Story = {
  args: { items: [] },
};
