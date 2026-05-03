import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import PprocToggleButton from './PprocToggleButton.vue';

const meta = {
  title: 'Pproc/Shared/UI/ToggleButton/PprocToggleButton',
  component: PprocToggleButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Generic toggle button used by the preprocessing panels. Renders an
icon, content, and checkbox slot. Emits \`click\` when not disabled.
`,
      },
    },
  },
  args: {
    selected: false,
    disabled: false,
    highlighted: false,
    onClick: fn(),
  },
} satisfies Meta<typeof PprocToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Unselected state with the default border. */
export const Unselected: Story = {};

/** Selected state with the accent border. */
export const Selected: Story = {
  args: { selected: true },
};

/** Disabled state — faded, no interaction. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** Highlighted state with the pulsing accent ring. */
export const Highlighted: Story = {
  args: { highlighted: true },
};
