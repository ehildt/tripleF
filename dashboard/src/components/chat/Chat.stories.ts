import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h } from 'vue';

import ChatAppGrid from '../../../.storybook/ChatAppGrid.vue';
import { createMockSocketProvider } from '../../../.storybook/mock-socket-provider';
import Chat from './Chat.vue';

const mockSocket = createMockSocketProvider();

const meta = {
  title: 'Chat/Chat',
  component: Chat,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Main orchestrator for the chat group. Wires the toolbar, the exchange
list, the prompt input, and the right-side panel (files / history)
together. Owns the socket subscription, the conversation/model/task wiring,
and the cross-component coordination (file select trigger, scroll to
exchange, dropdown exclusivity).
`,
      },
    },
  },
  args: {
    socketProvider: mockSocket,
  },
  decorators: [(story) => () => h(ChatAppGrid, null, () => h(story()))],
} satisfies Meta<typeof Chat>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default chat view. */
export const Default: Story = {};
