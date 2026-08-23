import type { Meta, StoryObj } from '@storybook/vue3-vite';

import StockmarketChartCard from './StockmarketChartCard.vue';

const tabs = [
  { id: 'candlestick', label: 'Candlestick' },
  { id: 'stacked', label: 'Stacked area' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'hlc', label: 'HLC area' },
];

const meta: Meta<typeof StockmarketChartCard> = {
  title: 'Stockmarket/StockmarketChartCard',
  component: StockmarketChartCard,
  render: (args) => ({
    components: { StockmarketChartCard },
    setup() {
      return { args };
    },
    template: `
      <StockmarketChartCard v-bind="args">
        <div style="height: 16rem; display: grid; place-items: center; color: var(--color-fg-muted);">
          Chart content goes here
        </div>
      </StockmarketChartCard>
    `,
  }),
};

export default meta;

type Story = StoryObj<typeof StockmarketChartCard>;

export const Default: Story = {
  args: {
    tabs,
    modelValue: 'candlestick',
  },
};

export const WithTickerSelector: Story = {
  args: {
    tabs,
    modelValue: 'candlestick',
    tickers: ['NVDA.US', 'AMD.US', 'MSFT.US'],
    selectedTicker: 'NVDA.US',
  },
};

export const SingleTickerHidden: Story = {
  args: {
    tabs,
    modelValue: 'candlestick',
    tickers: ['NVDA.US'],
  },
};
