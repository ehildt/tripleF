import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import PprocMasterToggle from './PprocMasterToggle.vue';

const meta = {
  title: 'Pproc/Shared/UI/MasterToggle/PprocMasterToggle',
  component: PprocMasterToggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Master toggle card for the preprocessing panel. Renders an icon, a
title, a description, and a checkbox. Emits \`toggle\` on click.
`,
      },
    },
  },
  args: {
    enabled: false,
    onToggle: fn(),
  },
} satisfies Meta<typeof PprocMasterToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default disabled state. */
export const Disabled: Story = {
  args: {
    enabled: false,
  },
};

/** Enabled state — filled checkbox and accent border. */
export const Enabled: Story = {
  args: {
    enabled: true,
  },
};
