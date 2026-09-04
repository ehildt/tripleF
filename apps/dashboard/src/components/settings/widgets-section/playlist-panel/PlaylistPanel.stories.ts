import type { Meta, StoryObj } from '@storybook/vue3-vite';

import PlaylistPanel from './PlaylistPanel.vue';

const meta = {
  title: 'Settings/WidgetsSection/PlaylistPanel',
  component: PlaylistPanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Playlist settings: keep the playlist in the chat right panel or float it as an app-level, draggable window that survives tab switches — plus the floating window's initial position, position memory, and autoclose.",
      },
    },
  },
} satisfies Meta<typeof PlaylistPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default playlist settings: panel mode, floating options disabled. */
export const Default: Story = {};
