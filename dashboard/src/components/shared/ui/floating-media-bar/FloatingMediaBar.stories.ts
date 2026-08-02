import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import FloatingMediaBar from './FloatingMediaBar.vue';

const meta = {
  title: 'Shared/UI/FloatingMediaBar',
  component: FloatingMediaBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Shared chrome bar for floating media popups. Provides a drag handle,
static or marquee title, opacity slider, playlist toggle, minimize
button, and close button.
`,
      },
    },
  },
  args: {
    title: 'Now Playing — Some video title',
    showTitleMarquee: false,
    opacityPercent: 75,
    isInPlaylist: false,
    minimizeTitle: 'Minimize',
    closeTitle: 'Close video',
    onDrag: fn(),
    onOpacityInput: fn(),
    onTogglePlaylist: fn(),
    onMinimize: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof FloatingMediaBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Static title with default opacity and add-to-playlist state. */
export const Default: Story = {};

/** Title scrolls when the playlist panel is hidden. */
export const Marquee: Story = {
  args: { showTitleMarquee: true },
};

/** Video is already in the playlist. */
export const InPlaylist: Story = {
  args: { isInPlaylist: true },
};
