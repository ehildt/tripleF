import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ProductSpecsList from './ProductSpecsList.vue';

const meta = {
  title: 'Chat/AssistantResponse/Templates/Product/ProductSpecsList',
  component: ProductSpecsList,
  tags: ['autodocs'],
  argTypes: { items: { control: 'object' } },
  args: {
    items: [
      { text: '30-hour battery life' },
      { text: 'Bluetooth 5.2 with multipoint' },
      { text: 'LDAC codec support' },
      { text: '254g weight' },
    ],
  },
} satisfies Meta<typeof ProductSpecsList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FewItems: Story = {
  args: { items: [{ text: 'Compact design' }] },
};
