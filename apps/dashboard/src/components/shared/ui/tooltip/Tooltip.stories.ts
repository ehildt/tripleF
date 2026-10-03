import { Search } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Tooltip from './Tooltip.vue';

const meta = {
  title: 'Shared/UI/Tooltip/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A glassy, borderless tooltip that replaces the native \`title\` attribute.
Wraps a trigger (default slot) and shows a frosted-glass panel with the given
text after a dwell on hover/focus — the panel fades in only once \`showDelay\`
(1s by default) has elapsed, so casual mouse swipes never flash a tooltip.
Mirrors the floating player's glassy tone — 50% fill, 12px backdrop blur,
no frame.
`,
      },
    },
  },
  args: {
    text: 'Search',
    positions: ['top'],
    disabled: false,
    showDelay: '1s',
  },
  render: (args) => ({
    components: { Tooltip, Search },
    setup: () => ({ args }),
    template: `
      <div style="display:flex;justify-content:center;padding:3rem;">
        <Tooltip v-bind="args"><Search /></Tooltip>
      </div>
    `,
  }),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default (top). */
export const Default: Story = {};

/** No dwell — the panel appears instantly, for previewing the glass tone. */
export const NoDelay: Story = { args: { showDelay: '0s' } };

/** Bottom. */
export const Bottom: Story = { args: { positions: ['bottom'] } };

/** Left. */
export const Left: Story = { args: { positions: ['left'] } };

/** Right. */
export const Right: Story = { args: { positions: ['right'] } };

/** Center — panel centered on the trigger. */
export const Center: Story = { args: { positions: ['center'] } };

/** Flips to the next allowed side when the preferred side has no room. */
export const Flip: Story = { args: { positions: ['top', 'bottom'] } };

/** Disabled — no panel is rendered. */
export const Disabled: Story = { args: { disabled: true } };
