import { ChartLine } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ChartToggle from './ChartToggle.vue';

const meta: Meta<typeof ChartToggle> = {
  title: 'Stockmarket/ChartToggle',
  component: ChartToggle,
  render: (args) => ({
    components: { ChartToggle },
    setup() {
      return { args };
    },
    template: `<ChartToggle v-bind="args" />`,
  }),
};

export default meta;

type Story = StoryObj<typeof ChartToggle>;

export const Default: Story = {
  args: { label: 'Line', icon: ChartLine },
};

export const Active: Story = {
  args: { label: 'Line', icon: ChartLine, active: true },
};

export const Disabled: Story = {
  args: { label: 'Line', icon: ChartLine, disabled: true },
};
