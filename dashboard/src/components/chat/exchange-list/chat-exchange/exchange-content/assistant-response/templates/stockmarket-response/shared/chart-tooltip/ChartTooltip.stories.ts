import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { ChartTooltipState } from './ChartTooltip.types';
import ChartTooltip from './ChartTooltip.vue';

const state = (overrides: Partial<ChartTooltipState>): ChartTooltipState => ({
  visible: true,
  x: 40,
  y: 40,
  rows: [
    { label: 'O', value: '217.50' },
    { label: 'H', value: '219.00' },
    { label: 'L', value: '216.10' },
    { label: 'C', value: '218.75', color: 'var(--color-status-success)' },
    { label: 'Vol', value: '1.24M' },
  ],
  ...overrides,
});

const meta: Meta<typeof ChartTooltip> = {
  title: 'Stockmarket/ChartTooltip',
  component: ChartTooltip,
  decorators: [
    () => ({
      template: `<div style="position: relative; height: 12rem; background: var(--color-bg-elevated); border: 1px solid var(--color-divider);"><story /></div>`,
    }),
  ],
  render: (args) => ({
    components: { ChartTooltip },
    setup() {
      return { args };
    },
    template: `<ChartTooltip :tooltip="args.tooltip" />`,
  }),
};

export default meta;

type Story = StoryObj<typeof ChartTooltip>;

export const Default: Story = {
  args: { tooltip: state({}) },
};

export const Hidden: Story = {
  args: { tooltip: state({ visible: false }) },
};

export const SingleRow: Story = {
  args: {
    tooltip: state({
      rows: [{ label: 'Close', value: '2,418.32' }],
    }),
  },
};
