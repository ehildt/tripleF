import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ChatRightToolbar from './ChatRightToolbar.vue';

const meta = {
  title: 'Chat/Right Toolbar/Chat Right Toolbar',
  component: ChatRightToolbar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The chat right toolbar: a self-contained orchestrator for the Files, Playlist,
and History sections. It owns its active view and tab visibility — reading the
conversation, playlist, and attached-files stores directly — renders each tab
only while its section has content, and caches panels with KeepAlive so
switching preserves scroll, drafts, and the history list.
        `,
      },
    },
  },
} satisfies Meta<typeof ChatRightToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state: reads the live stores, so it renders the sections that
 * actually have content in the current environment. */
export const Default: Story = {};
