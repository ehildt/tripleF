import type { Meta, StoryObj } from '@storybook/vue3-vite';

import RelatedStoryCard from './RelatedStoryCard.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/RelatedStoryCard',
  component: RelatedStoryCard,
  tags: ['autodocs'],
  argTypes: {
    item: { control: 'object' },
  },
  args: {
    item: {
      title: 'Global Markets React to Inflation Report',
      url: 'https://example.com/markets',
      sourceName: 'Reuters',
      date: '2026-07-11',
      imageUrl:
        'https://images.unsplash.com/photo-1611974765270-ca1258634369?w=640',
    },
  },
} satisfies Meta<typeof RelatedStoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutImage: Story = {
  args: {
    item: {
      title: 'Story without a thumbnail',
      url: 'https://example.com/no-image',
      sourceName: 'BBC News',
      date: '2026-07-10',
    },
  },
};

export const WithoutUrl: Story = {
  args: {
    item: {
      title: 'Plain title card',
      sourceName: 'Local News',
      date: '2026-07-09',
    },
  },
};

export const UrlFallback: Story = {
  args: {
    item: {
      url: 'https://example.com/url-only',
    },
  },
};
