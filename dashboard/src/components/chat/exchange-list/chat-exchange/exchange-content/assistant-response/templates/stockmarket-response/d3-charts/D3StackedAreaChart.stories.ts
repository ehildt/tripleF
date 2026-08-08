import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { D3StackedAreaSeries } from './D3Chart.types';
import D3StackedAreaChart from './D3StackedAreaChart.vue';

function series(
  name: string,
  base: number,
  volatility: number,
): D3StackedAreaSeries {
  return {
    name,
    points: Array.from({ length: 60 }, (_, i) => ({
      time: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
      value: base + Math.sin(i / 4) * volatility + i * 0.3,
    })),
  };
}

const meta: Meta<typeof D3StackedAreaChart> = {
  title: 'Stockmarket/D3StackedAreaChart',
  component: D3StackedAreaChart,
  render: (args) => ({
    components: { D3StackedAreaChart },
    setup() {
      return { args };
    },
    template: `<D3StackedAreaChart v-bind="args" />`,
  }),
};

export default meta;

type Story = StoryObj<typeof D3StackedAreaChart>;

export const Normalized: Story = {
  args: {
    mode: 'normalized',
    series: [
      series('Alpha', 100, 12),
      series('Beta', 80, 8),
      series('Gamma', 120, 15),
    ],
  },
};

export const Raw: Story = {
  args: {
    mode: 'raw',
    series: [series('Alpha', 100, 12), series('Beta', 80, 8)],
  },
};
