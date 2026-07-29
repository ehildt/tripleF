import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import FloatingVideoPopupBar from './FloatingVideoPopupBar.vue';

const meta = {
  title: 'Chat/ExchangeList/FloatingVideoFigure/FloatingVideoPopupBar',
  component: FloatingVideoPopupBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The chrome bar of the floating video popup: title or scrolling now-playing
marquee (while the playlist panel is hidden), an opacity slider and the
right-aligned icon cluster (playlist toggle, close) with equal gap-1
spacing. The whole bar drags the popup; controls stop pointer events.`,
      },
    },
  },
  argTypes: {
    showTitleMarquee: { control: 'boolean' },
    isInPlaylist: { control: 'boolean' },
    opacityPercent: { control: { type: 'range', min: 25, max: 100 } },
  },
  args: {
    title: 'Rick Astley — Never Gonna Give You Up (Official Music Video)',
    showTitleMarquee: false,
    opacityPercent: 100,
    isInPlaylist: false,
    closeTitle: 'Close video',
    onDrag: fn(),
    onOpacityInput: fn(),
    onTogglePlaylist: fn(),
    onClose: fn(),
  },
  render: (args) => ({
    components: { FloatingVideoPopupBar },
    setup() {
      return { args };
    },
    template: `
      <div style="width: 22rem; border: 1px solid var(--color-divider); background: var(--color-bg-elevated);">
        <FloatingVideoPopupBar
          :title="args.title"
          :show-title-marquee="args.showTitleMarquee"
          :opacity-percent="args.opacityPercent"
          :is-in-playlist="args.isInPlaylist"
          :close-title="args.closeTitle"
          @drag="args.onDrag"
          @opacity-input="args.onOpacityInput"
          @toggle-playlist="args.onTogglePlaylist"
          @close="args.onClose"
        />
      </div>
    `,
  }),
} satisfies Meta<typeof FloatingVideoPopupBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Static title (playlist panel visible). */
export const Default: Story = {};

/** Scrolling marquee — shown while the playlist panel is hidden. */
export const Marquee: Story = {
  args: { showTitleMarquee: true },
};

/** Video already added — toggle offers removal. */
export const InPlaylist: Story = {
  args: { isInPlaylist: true },
};

/** Dimmed popup — slider filled to the lowered opacity. */
export const LowOpacity: Story = {
  args: { opacityPercent: 45 },
};
