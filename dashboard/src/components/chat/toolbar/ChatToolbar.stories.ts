import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ChatToolbar from './ChatToolbar.vue';

const meta = {
  title: 'Chat/Toolbar/ChatToolbar',
  component: ChatToolbar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Orchestrator for the chat toolbar. Wires together model selection,
conversation management, stream settings, event subscriptions, and
file attachments. Each section expands exclusively.
`,
      },
    },
  },
  argTypes: {
    chatActive: { control: 'boolean' },
    promptFocused: { control: 'boolean' },
  },
  args: {
    chatActive: true,
    promptFocused: false,
  },
} satisfies Meta<typeof ChatToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default toolbar state. */
export const Default: Story = {};

/** Toolbar with prompt focused. */
export const PromptFocused: Story = {
  args: { promptFocused: true },
};

/** Toolbar with no active chat. */
export const Inactive: Story = {
  args: { chatActive: false },
};
