import type { Meta, StoryObj } from '@storybook/vue3-vite';

import StockmarketItemDescription from './StockmarketItemDescription.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/StockmarketItemResponse/Description',
  component: StockmarketItemDescription,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Short description paragraph of a single-instrument stock card.
Presentational.
`,
      },
    },
  },
  argTypes: {
    text: { control: 'text' },
  },
  args: {
    text: 'NVIDIA extended its rally on strong data-center demand, closing near its 52-week high.',
  },
} satisfies Meta<typeof StockmarketItemDescription>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
