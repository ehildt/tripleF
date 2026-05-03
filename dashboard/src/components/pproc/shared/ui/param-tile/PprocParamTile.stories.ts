import { Zap } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import PprocParamTile from './PprocParamTile.vue';

const meta = {
  title: 'Pproc/Shared/UI/ParamTile/PprocParamTile',
  component: PprocParamTile,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Single parameter tile inside the options panel. Renders an icon, a
label, an optional input slot, and a description. Shows a reset button
when \`modified\` is true.
`,
      },
    },
  },
  args: {
    icon: Zap,
    label: 'Blur Sigma',
    description: 'Gaussian blur amount',
    disabled: false,
    highlighted: false,
    modified: false,
    onReset: fn(),
  },
} satisfies Meta<typeof PprocParamTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default tile with the label and description. */
export const Default: Story = {
  render: (args) => ({
    components: { PprocParamTile },
    setup: () => ({ args }),
    template: `
      <div class="w-48">
        <PprocParamTile v-bind="args">
          <div class="text-fg-primary font-mono text-sm">1.0</div>
        </PprocParamTile>
      </div>
    `,
  }),
};

/** Tile with the reset button visible. */
export const Modified: Story = {
  args: { modified: true },
};

/** Tile highlighted to show its linked variant. */
export const Highlighted: Story = {
  args: { highlighted: true },
};

/** Disabled tile. */
export const Disabled: Story = {
  args: { disabled: true, modified: true },
};
