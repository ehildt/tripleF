import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import PlaylistTransportBar from './PlaylistTransportBar.vue';

const meta = {
  title: 'Chat/RightPanel/PlaylistTransportBar',
  component: PlaylistTransportBar,
  tags: ['autodocs'],
  args: {
    playing: true,
    canTogglePlayback: true,
    playbackToggleTitle: 'Pause',
    hasActivePlayback: true,
    autoplayEnabled: true,
    popoutHidden: false,
    nowPlayingTitle: 'Stellar Blade — Official Launch Trailer',
    onTogglePlayback: fn(),
    onStopPlayback: fn(),
    onToggleAutoplay: fn(),
    onTogglePopoutVisibility: fn(),
  },
} satisfies Meta<typeof PlaylistTransportBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playing: Story = {};

export const Paused: Story = {
  args: { playing: false, playbackToggleTitle: 'Play' },
};

export const NothingPlaying: Story = {
  args: {
    playing: false,
    canTogglePlayback: false,
    playbackToggleTitle: 'Nothing is playing',
    hasActivePlayback: false,
    nowPlayingTitle: undefined,
  },
};
