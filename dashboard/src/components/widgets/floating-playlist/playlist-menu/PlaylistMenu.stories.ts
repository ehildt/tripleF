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
    activePlaylistName: '',
    onSelect: fn(),
    'onUpdate:playlistName': fn(),
    onCreate: fn(),
    onDelete: fn(),
    onRename: fn(),
  },
  parameters: {
    docs: {
      description: {
        component: `
Saved-playlists menu of the floating playlist toolbar row: the name field
(input plus a Plus button) is the first row, then the saved playlists — each
is an editable name input with its own Trash button (focus loads it, editing
renames it on blur, emptying the field deletes it). The Plus button (or
Enter) saves the typed name as a new playlist and clears the field; the
active playlist is tinted. Open the menu via the trigger icon.
`,
      },
    },
  },
} satisfies Meta<typeof PlaylistMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Temporary queue: the name field is empty with a Plus button, lists are available. */
export const Default: Story = {};

/** Named queue: the active playlist is tinted in the list. */
export const ActivePlaylist: Story = {
  args: { activePlaylistName: 'Focus mix' },
};

/** No saved playlists yet: only the name field. */
export const Empty: Story = {
  args: { playlists: [] },
};
