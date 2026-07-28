import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SourcesPanel from './SourcesPanel.vue';

const meta = {
  title: 'SysCtl/SourcesPanel',
  component: SourcesPanel,
  tags: ['autodocs'],
  args: {
    sources: {
      preferred: ['wikipedia.org', 'arstechnica.com'],
      blocked: ['t0.gstatic.com', 'pinterest.com'],
    },
  },
} satisfies Meta<typeof SourcesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    sources: { preferred: [], blocked: [] },
  },
};
