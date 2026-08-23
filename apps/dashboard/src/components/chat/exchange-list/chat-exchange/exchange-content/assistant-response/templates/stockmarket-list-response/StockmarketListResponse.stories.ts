import type { Meta, StoryObj } from '@storybook/vue3-vite';

import StockmarketListResponse from './StockmarketListResponse.vue';

const history = [
  {
    time: '2026-01-02',
    open: 200,
    high: 205,
    low: 198,
    close: 203,
    volume: 1200,
  },
  {
    time: '2026-01-05',
    open: 203,
    high: 210,
    low: 201,
    close: 208,
    volume: 1400,
  },
  {
    time: '2026-01-06',
    open: 208,
    high: 212,
    low: 205,
    close: 206,
    volume: 1100,
  },
  {
    time: '2026-01-07',
    open: 206,
    high: 214,
    low: 204,
    close: 212,
    volume: 1500,
  },
  {
    time: '2026-01-08',
    open: 212,
    high: 218,
    low: 210,
    close: 217,
    volume: 1600,
  },
  {
    time: '2026-01-09',
    open: 217,
    high: 220,
    low: 214,
    close: 215,
    volume: 1300,
  },
  {
    time: '2026-01-12',
    open: 215,
    high: 222,
    low: 213,
    close: 220,
    volume: 1700,
  },
  {
    time: '2026-01-13',
    open: 220,
    high: 226,
    low: 218,
    close: 224,
    volume: 1800,
  },
  {
    time: '2026-01-14',
    open: 224,
    high: 228,
    low: 221,
    close: 226,
    volume: 1500,
  },
  {
    time: '2026-01-15',
    open: 226,
    high: 230,
    low: 223,
    close: 228,
    volume: 1900,
  },
];

const meta = {
  title: 'Chat/AssistantResponse/Templates/StockmarketListResponse',
  component: StockmarketListResponse,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Market overview card: a summary, a tabbed relative-performance chart
(stacked area / candlestick / heatmap / HLC area) with reference lines and
markers, and a list of the requested instruments with their quotes.
`,
      },
    },
  },
  argTypes: { data: { control: 'object' } },
  args: {
    data: {
      category: 'Market',
      title: 'Tech Stocks Overview',
      subtitle: 'NVDA, AMD & MSCI World',
      summary:
        'Risk-on tone across tech as AI names led gains; NVDA outperformed while AMD lagged.',
      items: [
        {
          name: 'NVIDIA',
          ticker: 'NVDA.US',
          price: 228,
          change: 2.4,
          changeP: 1.06,
        },
        {
          name: 'AMD',
          ticker: 'AMD.US',
          price: 182,
          change: -1.1,
          changeP: -0.6,
        },
        {
          name: 'MSCI World',
          ticker: 'URTH.US',
          price: 141,
          change: 0.8,
          changeP: 0.57,
        },
      ],
      referenceLines: [
        { value: 200, label: 'Support', color: 'status-success' },
        { value: 230, label: 'Resistance', color: 'status-error' },
      ],
      sources: [
        {
          title: 'EODHD market data',
          url: 'https://eodhd.com',
          sourceName: 'EODHD',
        },
      ],
    },
    revealCharts: true,
    chartData: {
      'eodhdHistory:NVDA.US': { ticker: 'NVDA.US', history },
      'eodhdHistory:AMD.US': {
        ticker: 'AMD.US',
        history: history.map((p) => ({ ...p, close: p.close * 0.8 })),
      },
    },
  },
} satisfies Meta<typeof StockmarketListResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fully populated market overview with charts revealed. */
export const Default: Story = {};

/** No data — shows the empty state. */
export const Empty: Story = { args: { data: {} } };

/** Charts hidden until the respond step streams. */
export const ChartsHidden: Story = {
  args: { revealCharts: false },
};
