import type { Meta, StoryObj } from '@storybook/vue3-vite';

import UserRequest from './UserRequest.vue';

const meta = {
  title:
    'Chat/ExchangeList/ChatExchange/ExchangeContent/UserRequest/UserRequest',
  component: UserRequest,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Renders a user message as plain text.',
      },
    },
  },
  argTypes: {
    content: { control: 'text' },
  },
  args: {
    content: 'Can you summarize this article for me?',
  },
} satisfies Meta<typeof UserRequest>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default plain-text user message. */
export const Default: Story = {};

/** User message containing text that looks like HTML. */
export const EscapedMarkup: Story = {
  args: {
    content:
      'Please compare <strong>these two approaches</strong> and include 3 images.',
  },
};
