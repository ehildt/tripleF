import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import PlaylistItem from './PlaylistItem.vue';

const meta = {
  title: 'Chat/RightPanel/PlaylistItem',
  component: PlaylistItem,
  tags: ['autodocs'],
  args: {
    item: {
      videoUrl: 'https://www.youtube.com/watch?v=CCHdMIEGaaM',
      title:
        'Boards of Canada - Dayvan Cowboy (Official Music Video, Remastered)',
      channel: 'Warp Records',
      duration: '5:02',
      date: '2006',
    },
    isActive: false,
    onPlay: fn(),
    onRemove: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          'One compact row of the playlist: title, meta, remove button. The active (now-playing) item scrolls its title as a marquee inside the row instead of a separate bar.',
      },
    },
  },
} satisfies Meta<typeof PlaylistItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Idle row: static single-line title. */
export const Default: Story = {};

/** Now playing: the title scrolls as a marquee inside the row. */
export const Active: Story = {
  args: { isActive: true },
};

/** Title and meta only (no channel/date line). */
export const TitleOnly: Story = {
  args: {
    item: {
      videoUrl: 'https://youtu.be/xyz',
      title: 'Untitled session',
    },
  },
};
