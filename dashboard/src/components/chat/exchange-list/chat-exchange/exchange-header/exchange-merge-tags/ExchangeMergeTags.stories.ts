import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ExchangeMergeTags from './ExchangeMergeTags.vue';

const meta = {
  title: 'Chat/ExchangeList/ChatExchange/ExchangeHeader/ExchangeMergeTags',
  component: ExchangeMergeTags,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Merge marker row: one glassy square tag per consolidated request id.',
      },
    },
  },
  argTypes: {
    requestIds: { control: 'object' },
  },
  args: {
    requestIds: ['req-7f3a9c21', 'req-2b81d0e4'],
  },
} satisfies Meta<typeof ExchangeMergeTags>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A merge consolidating two earlier requests. */
export const TwoSources: Story = {};

/** A merge consolidating several requests — tags wrap on narrow chats. */
export const ManySources: Story = {
  args: {
    requestIds: [
      'req-7f3a9c21',
      'req-2b81d0e4',
      'req-9c44f1a7',
      'req-5d0e8b32',
    ],
  },
};
