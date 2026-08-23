import type { Meta, StoryObj } from '@storybook/vue3-vite';

import PprocToolsPanel from './PprocToolsPanel.vue';

const meta = {
  title: 'Pproc/ToolsPanel/PprocToolsPanel',
  component: PprocToolsPanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Left-side tools panel of the preprocessing view. Renders the master
toggle, the resize settings (max width, max height, prevent
upscaling), and the image-variants selector. Reads and writes the
preprocessing store directly.
`,
      },
    },
  },
} satisfies Meta<typeof PprocToolsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default view with preprocessing enabled. */
export const Default: Story = {};

/** Disabled state. */
export const Disabled: Story = {};
