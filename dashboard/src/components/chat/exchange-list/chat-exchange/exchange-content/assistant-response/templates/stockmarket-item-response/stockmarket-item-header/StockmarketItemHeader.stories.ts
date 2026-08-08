import type { Meta, StoryObj } from '@storybook/vue3-vite';

import StockmarketItemHeader from './StockmarketItemHeader.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/StockmarketItemResponse/Header',
  component: StockmarketItemHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Quote header of a single-instrument stock card: the instrument title
with its optional subtitle. Presentational.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
  },
  args: {
    title: 'NVIDIA (NVDA.US)',
    subtitle: 'Semiconductors · S&P 500',
  },
} satisfies Meta<typeof StockmarketItemHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** No subtitle — title only. */
export const TitleOnly: Story = {
  args: { subtitle: undefined },
};
