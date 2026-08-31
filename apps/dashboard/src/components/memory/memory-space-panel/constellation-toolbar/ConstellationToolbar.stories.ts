import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ConstellationToolbar from './ConstellationToolbar.vue';

const meta = {
  title: 'Sysctl/MemorySection/ConstellationToolbar',
  component: ConstellationToolbar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The shared action row for the three memory spaces: reload, label toggle,
expand/collapse-all topics, view reset, rotation toggle, and the optional
armed two-click wipe (read-only spaces omit the wipe).`,
      },
    },
  },
  argTypes: {
    refreshTitle: { control: 'text' },
    isRefreshDisabled: { control: 'boolean' },
    showLabels: { control: 'boolean' },
    rotationEnabled: { control: 'boolean' },
    isAllExpanded: { control: 'boolean' },
    showSuggested: { control: 'boolean' },
    wipeTitle: { control: 'text' },
    wipeArmed: { control: 'boolean' },
    isWipeDisabled: { control: 'boolean' },
  },
  args: {
    refreshTitle: 'Reload facts',
    isRefreshDisabled: false,
    showLabels: true,
    rotationEnabled: true,
    isAllExpanded: false,
    showSuggested: true,
  },
} satisfies Meta<typeof ConstellationToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A writable space (partition/cognition): reload + wipe with confirm arming. */
export const Writable: Story = {
  args: {
    wipeTitle: 'Wipe partition facts',
    wipeArmed: false,
    isWipeDisabled: false,
  },
};

/** The armed second-click state of the two-click wipe confirm. */
export const WipeArmed: Story = {
  args: {
    wipeTitle: 'Wipe partition facts',
    wipeArmed: true,
    isWipeDisabled: false,
  },
};

/** A read-only space (encyclopedia): no wipe button at all. */
export const ReadOnly: Story = {};

/** Every topic expanded — the toggle shows the collapse-all icon. */
export const AllExpanded: Story = {
  args: { isAllExpanded: true },
};

/** Weak (suggested) edges hidden — the electricity arcs are off. */
export const SuggestedOff: Story = {
  args: { showSuggested: false },
};
