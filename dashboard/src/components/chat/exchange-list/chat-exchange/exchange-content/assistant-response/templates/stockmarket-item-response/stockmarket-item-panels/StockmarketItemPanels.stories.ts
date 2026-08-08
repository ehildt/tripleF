import type { Meta, StoryObj } from '@storybook/vue3-vite';

import StockmarketItemPanels from './StockmarketItemPanels.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/StockmarketItemResponse/Panels',
  component: StockmarketItemPanels,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Two-panel row below the chart: fundamentals cards and key findings share
one field grid, so the chart spans the full width. Cards flow two per
row — fundamentals first, then findings. Presentational.
`,
      },
    },
  },
  args: {
    fundamentals: [
      { key: 'name', label: 'Name', value: 'NVIDIA Corporation' },
      { key: 'sector', label: 'Sector', value: 'Technology' },
      { key: 'marketCap', label: 'Market Cap', value: '$5.6T' },
      { key: 'peRatio', label: 'P/E Ratio', value: '45.2' },
    ],
    keyPoints: [
      { text: 'Market cap: $5.6T' },
      { text: 'P/E: 45.2' },
      { text: 'RSI (14): 72' },
      { text: '52w range: $95–$230' },
    ],
  },
} satisfies Meta<typeof StockmarketItemPanels>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Fundamentals only — no key findings. */
export const FundamentalsOnly: Story = {
  args: { keyPoints: [] },
};

/** Key findings only — no fundamentals. */
export const FindingsOnly: Story = {
  args: { fundamentals: [] },
};
