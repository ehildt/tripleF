import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h } from 'vue';

import PprocAppGrid from '../../../.storybook/PprocAppGrid.vue';
import Pproc from './Pproc.vue';

const meta = {
  title: 'Pproc/Pproc',
  component: Pproc,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Main orchestrator for the preprocessing group. Wires the tools panel
(master toggle, resize, variants) and the options panel (advanced
parameters) together inside the app's 12-column grid.
`,
      },
    },
  },
  decorators: [(story) => () => h(PprocAppGrid, null, () => h(story()))],
} satisfies Meta<typeof Pproc>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default preprocessing view. */
export const Default: Story = {};
