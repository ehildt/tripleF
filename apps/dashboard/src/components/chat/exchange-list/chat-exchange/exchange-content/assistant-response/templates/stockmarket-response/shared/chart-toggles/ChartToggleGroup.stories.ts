import { ChartArea, ChartCandlestick, ChartLine } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { ChartToggleOption } from './ChartToggleGroup.types';
import ChartToggleGroup from './ChartToggleGroup.vue';

const options: ChartToggleOption[] = [
  { id: 'candles', labelKey: 'common.chartCandles', icon: ChartCandlestick },
  { id: 'line', labelKey: 'common.chartLine', icon: ChartLine },
  { id: 'area', labelKey: 'common.chartArea', icon: ChartArea },
];

const meta: Meta<typeof ChartToggleGroup> = {
  title: 'Stockmarket/ChartToggleGroup',
  component: ChartToggleGroup,
  render: (args) => ({
    components: { ChartToggleGroup },
    setup() {
      return { args };
    },
    template: `<ChartToggleGroup v-bind="args" />`,
  }),
};

export default meta;

type Story = StoryObj<typeof ChartToggleGroup>;

export const Default: Story = {
  args: { groupLabel: 'Price style', options, modelValue: 'line' },
};

export const Disabled: Story = {
  args: {
    groupLabel: 'Price style',
    options,
    modelValue: 'line',
    disabled: true,
  },
};
