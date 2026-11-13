import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import PlaylistMenu from './PlaylistMenu.vue';

const meta = {
  title: 'Chat/Right Toolbar/Playlist/Playlist Menu',
  component: PlaylistMenu,
  tags: ['autodocs'],
  args: {
    playlistName: '',
    playlists: ['Focus mix', 'Long ambient', 'Live sessions'],
    activePlaylistName: '',
    onSelect: fn(),
    onLoadFile: fn(),
    onSaveFile: fn(),
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
(input plus Load and Plus buttons) is the first row, then the saved playlists
— each is an editable name input with Edit, Save, and Trash buttons (focus
loads it, editing renames it on blur, emptying the field deletes it). Load
imports a JSON file, each row's Save exports that playlist, and Plus (or
Enter) saves the typed name as a new playlist. The active playlist is tinted.
Open the menu via the list-video trigger icon.
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
