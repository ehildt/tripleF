import type { Meta, StoryObj } from '@storybook/vue3-vite';

import StockmarketItemRecommendation from './StockmarketItemRecommendation.vue';

const meta = {
  title:
    'Chat/AssistantResponse/Templates/StockmarketItemResponse/Recommendation',
  component: StockmarketItemRecommendation,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Recommendation callout of a single-instrument stock card: the verdict
(e.g. Buy/Hold/Sell) with optional reasoning. Presentational.
`,
      },
    },
  },
  argTypes: {
    recommendation: { control: 'text' },
    reasoning: { control: 'text' },
  },
  args: {
    recommendation: 'Buy',
    reasoning:
      'RSI (14) at 72 signals momentum while MACD stays bullish above its signal line.',
  },
} satisfies Meta<typeof StockmarketItemRecommendation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Verdict without reasoning. */
export const VerdictOnly: Story = {
  args: { reasoning: undefined },
};
