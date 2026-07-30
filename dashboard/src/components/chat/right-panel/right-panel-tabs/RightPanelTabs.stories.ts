import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import RightPanelTabs from './RightPanelTabs.vue';

const meta = {
  title: 'Chat/RightPanel/Tabs',
  component: RightPanelTabs,
  tags: ['autodocs'],
  args: {
    activeView: 'files',
    hasAttachments: true,
    hasPlaylist: true,
    hasHistory: true,
    onSelectView: fn(),
  },
} satisfies Meta<typeof RightPanelTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FilesActive: Story = {};

export const PlaylistActive: Story = {
  args: { activeView: 'playlist' },
};

export const HistoryActive: Story = {
  args: { activeView: 'history' },
};

export const FilesOnly: Story = {
  args: { hasPlaylist: false, hasHistory: false },
};
