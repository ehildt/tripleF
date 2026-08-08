import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { useAppStore } from '@/stores/app';

import ChatConversationHeader from './ChatConversationHeader.vue';

const meta = {
  title: 'Chat/SessionHeader/ChatConversationHeader',
  component: ChatConversationHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Header bar for an active chat conversation. Shows the conversation title and
toggles for the per-conversation scroll mode and media-priority preference.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    conversationId: { control: 'text' },
  },
  args: {
    title: 'My Chat Conversation',
    conversationId: 'conversation-1',
  },
} satisfies Meta<typeof ChatConversationHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default conversation header with a title and toggles. */
export const Default: Story = {};

/** Long title that may need truncation. */
export const LongTitle: Story = {
  args: {
    title:
      'A very long conversation title that tests text truncation behavior in the header component',
  },
};

/** Conversation prioritizing the video gallery over images. */
export const VideosPriority: Story = {
  render: (args) => ({
    components: { ChatConversationHeader },
    setup() {
      const appStore = useAppStore();
      appStore.setConversationMediaPriority(args.conversationId, 'videos');
      return { args };
    },
    template: '<ChatConversationHeader v-bind="args" />',
  }),
};
