import type { Meta, StoryObj } from '@storybook/vue3-vite';

import StockmarketItemResponse from './StockmarketItemResponse.vue';

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

const technical = [
  { time: '2026-01-02', value: 55 },
  { time: '2026-01-05', value: 58 },
  { time: '2026-01-06', value: 57 },
  { time: '2026-01-07', value: 61 },
  { time: '2026-01-08', value: 64 },
  { time: '2026-01-09', value: 62 },
  { time: '2026-01-12', value: 66 },
  { time: '2026-01-13', value: 69 },
  { time: '2026-01-14', value: 68 },
  { time: '2026-01-15', value: 72 },
];

const meta = {
  title: 'Chat/AssistantResponse/Templates/StockmarketItemResponse',
  component: StockmarketItemResponse,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Single-instrument stock-market card: a quote header, a recommendation,
key points, fundamentals, and one chart that merges the previous candlestick /
HLC area / line / heatmap views — price style (candles, line, area) and volume
style (histogram, heatmap) are toggles on a single canvas, with reference lines,
markers, moving average, and intraday support. News and sources are shown as
one deduplicated list.
`,
      },
    },
  },
  argTypes: { data: { control: 'object' } },
  args: {
    data: {
      category: 'Stock',
      title: 'NVIDIA (NVDA.US)',
      subtitle: 'Semiconductors · S&P 500',
      shortDescription:
        'NVIDIA extended its rally on strong data-center demand, closing near its 52-week high.',
      currentPrice: 228,
      change: 2.4,
      changeP: 1.06,
      recommendation: 'Buy',
      recommendationReasoning:
        'RSI (14) at 72 signals momentum while MACD stays bullish above its signal line.',
      keyPoints: [
        { text: 'Market cap: $5.6T' },
        { text: 'P/E: 45.2' },
        { text: 'RSI (14): 72' },
        { text: '52w range: $95–$230' },
      ],
      fundamentals: {
        name: 'NVIDIA Corporation',
        sector: 'Technology',
        industry: 'Semiconductors',
        marketCap: '$5.6T',
        peRatio: '45.2',
        revenue: '$130.5B',
        profitMargin: '55%',
      },
      referenceLines: [
        { value: 200, label: 'Support', color: 'status-success' },
        { value: 230, label: 'Resistance', color: 'status-error' },
      ],
      markers: [
        {
          time: '2026-01-08',
          position: 'belowBar',
          shape: 'circle',
          color: 'harmony-3',
          text: 'D',
        },
      ],
      news: [
        {
          title: 'NVIDIA hits record high on AI chip demand',
          url: 'https://example.com/nvidia-record',
          source: 'Reuters',
          date: '2026-01-15',
        },
      ],
      sources: [
        {
          title: 'NVIDIA investor relations',
          url: 'https://investor.nvidia.com',
          sourceName: 'NVIDIA',
        },
      ],
    },
    revealCharts: true,
    chartData: {
      'eodhdHistory:NVDA.US': { history },
      'eodhdTechnical:NVDA.US': { technical },
    },
  },
} satisfies Meta<typeof StockmarketItemResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fully populated single-instrument card with charts revealed. */
export const Default: Story = {};

/** No data — shows the empty state. */
export const Empty: Story = { args: { data: {} } };

/** Charts hidden until the respond step streams. */
export const ChartsHidden: Story = {
  args: { revealCharts: false },
};
