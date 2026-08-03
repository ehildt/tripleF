import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import FloatingPopout from './FloatingPopout.vue';

const meta = {
  title: 'Shared/UI/FloatingPopout',
  component: FloatingPopout,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Standalone floating popup window: a drag bar (title, opacity slider,
playlist toggle, minimize, close) over a media slot, wrapped in an
eight-direction resize grid. Position/size/opacity/visibility come from
the consumer via style/class on the root; all interactions are forwarded
as events.
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
    closeTitle: 'Close',
    style: { left: '1rem', top: '4rem' },
    onDrag: fn(),
    onOpacityInput: fn(),
    onTogglePlaylist: fn(),
    onMinimize: fn(),
    onClose: fn(),
    onResize: fn(),
  },
} satisfies Meta<typeof FloatingPopout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Static title, default opacity, placeholder media. */
export const Default: Story = {
  args: {
    default: undefined,
  },
  render: (args) => ({
    components: { FloatingPopout },
    setup: () => ({ args }),
    template: `
      <FloatingPopout v-bind="args">
        <div style="
          display:grid; place-items:center; width:100%; height:100%;
          background: #12141a; color:#9aa3b2; font-family:monospace;
          font-size:0.65rem; text-transform:uppercase; letter-spacing:0.05em;
        ">media preview</div>
      </FloatingPopout>
    `,
  }),
};

/** Title scrolls when the playlist panel is hidden. */
export const Marquee: Story = {
  args: { showTitleMarquee: true },
  render: (args) => ({
    components: { FloatingPopout },
    setup: () => ({ args }),
    template: `
      <FloatingPopout v-bind="args">
        <div style="
          display:grid; place-items:center; width:100%; height:100%;
          background: #12141a; color:#9aa3b2; font-family:monospace;
          font-size:0.65rem; text-transform:uppercase; letter-spacing:0.05em;
        ">media preview</div>
      </FloatingPopout>
    `,
  }),
};

/** Media is already in the playlist. */
export const InPlaylist: Story = {
  args: { isInPlaylist: true },
  render: (args) => ({
    components: { FloatingPopout },
    setup: () => ({ args }),
    template: `
      <FloatingPopout v-bind="args">
        <div style="
          display:grid; place-items:center; width:100%; height:100%;
          background: #12141a; color:#9aa3b2; font-family:monospace;
          font-size:0.65rem; text-transform:uppercase; letter-spacing:0.05em;
        ">media preview</div>
      </FloatingPopout>
    `,
  }),
};

/** Bare/docked: chrome stripped, media stays mounted, sized by the root. */
export const Docked: Story = {
  args: {
    docked: true,
    style: { left: '1rem', top: '4rem', width: '22rem', height: '12rem' },
  },
  render: (args) => ({
    components: { FloatingPopout },
    setup: () => ({ args }),
    template: `
      <FloatingPopout v-bind="args">
        <div style="
          display:grid; place-items:center; width:100%; height:100%;
          background: #12141a; color:#9aa3b2; font-family:monospace;
          font-size:0.65rem; text-transform:uppercase; letter-spacing:0.05em;
        ">media preview</div>
      </FloatingPopout>
    `,
  }),
};
