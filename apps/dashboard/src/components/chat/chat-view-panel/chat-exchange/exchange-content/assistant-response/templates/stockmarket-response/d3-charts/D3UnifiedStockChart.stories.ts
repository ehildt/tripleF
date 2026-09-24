import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { D3ChartPoint } from './D3Chart.types';
import D3UnifiedStockChart from './D3UnifiedStockChart.vue';

function history(length: number, base: number): D3ChartPoint[] {
  return Array.from({ length }, (_, i) => {
    const close = base + Math.sin(i / 3) * 12 + i * 0.4;
    const day = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
    return {
      time: day,
      open: close - 2,
      high: close + 3,
      low: close - 3,
      close,
      volume: 1000 + (i % 7) * 250,
    };
  });
}

const meta: Meta<typeof D3UnifiedStockChart> = {
  title: 'Stockmarket/D3UnifiedStockChart',
  component: D3UnifiedStockChart,
  render: (args) => ({
    components: { D3UnifiedStockChart },
    setup() {
      return { args };
    },
    template: `<D3UnifiedStockChart v-bind="args" />`,
  }),
};

export default meta;

type Story = StoryObj<typeof D3UnifiedStockChart>;

export const Default: Story = {
  args: {
    history: history(60, 200),
    currency: 'USD',
    referenceLines: [
      { value: 235, label: 'Resistance' },
      { value: 190, label: 'Support' },
    ],
  },
};

export const WithMarkers: Story = {
  args: {
    history: history(60, 200),
    currency: 'USD',
    markers: [
      {
        time: '2026-01-10',
        position: 'belowBar',
        shape: 'arrowUp',
        color: 'status-success',
        text: 'Buy',
      },
      {
        time: '2026-01-20',
        position: 'aboveBar',
        shape: 'arrowDown',
        color: 'status-error',
        text: 'Sell',
      },
    ],
  },
};

export const HeatmapCells: Story = {
  args: {
    history: history(60, 200),
    currency: 'USD',
    volumeProfile: [],
  },
};

export const Intraday: Story = {
  args: {
    history: Array.from({ length: 78 }, (_, i) => {
      const close = 200 + Math.sin(i / 4) * 5 + i * 0.1;
      const hour = String(9 + Math.floor(i / 12)).padStart(2, '0');
      const minute = String((i % 12) * 5).padStart(2, '0');
      return {
        time: `2026-01-05T${hour}:${minute}:00Z`,
        open: close - 1,
        high: close + 2,
        low: close - 2,
        close,
        volume: 500 + (i % 6) * 100,
      };
    }),
    currency: 'USD',
    intradayActive: true,
  },
};
