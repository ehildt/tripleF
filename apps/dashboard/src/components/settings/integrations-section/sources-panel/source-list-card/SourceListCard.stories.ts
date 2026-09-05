import { Ban, ThumbsUp } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SourceListCard from './SourceListCard.vue';

const meta = {
  title: 'Settings/SourcesPanel/SourceListCard',
  component: SourceListCard,
  tags: ['autodocs'],
  args: {
    list: ['bbc.com', 'arstechnica.com'],
    icon: ThumbsUp,
    label: 'Preferred sources',
    description: 'Hint text',
    resetTitle: 'Reset',
    placeholder: 'bbc.com\narstechnica.com',
  },
} satisfies Meta<typeof SourceListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Blocked: Story = {
  args: {
    list: ['t0.gstatic.com', 'pinterest.com'],
    icon: Ban,
    label: 'Blocked sources',
    description: 'Regex entries kept verbatim',
    placeholder: '*.pinterest.com\n/^lh\\d+\\.googleusercontent\\.com$/',
  },
};

export const Empty: Story = {
  args: { list: [] },
};
