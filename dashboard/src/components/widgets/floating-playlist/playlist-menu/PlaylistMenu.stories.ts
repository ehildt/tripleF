import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import PlaylistMenu from './PlaylistMenu.vue';

const meta = {
  title: 'Widgets/FloatingPlaylist/PlaylistMenu',
  component: PlaylistMenu,
  tags: ['autodocs'],
  args: {
    playlistName: '',
    playlists: ['Focus mix', 'Long ambient', 'Live sessions'],
    onSelect: fn(),
    'onUpdate:playlistName': fn(),
  },
  parameters: {
    docs: {
      description: {
        component: `
Saved-playlists menu of the floating playlist toolbar row: the name input is
the first field, a divider, then the saved playlists — picking one autoloads
it (no load button, no checkmarks; the active playlist is only tinted).
Open the menu via the trigger icon.
`,
      },
    },
  },
} satisfies Meta<typeof PlaylistMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Temporary queue: the name input is empty, lists are available. */
export const Default: Story = {};

/** Named queue: the input shows the active playlist, tinted in the list. */
export const ActivePlaylist: Story = {
  args: { playlistName: 'Focus mix' },
};

/** No saved playlists yet: only the name input and the empty hint. */
export const Empty: Story = {
  args: { playlists: [] },
};
