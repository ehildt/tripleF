import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ChatRightPanel from './ChatRightPanel.vue';

const placeholderImage =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const meta = {
  title: 'Chat/RightPanel',
  component: ChatRightPanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Right-side panel for the chat view. Shows attached files and the
conversation history in a single merged Files tab.
`,
      },
    },
  },
  args: {
    attachments: [
      {
        id: 'pending-1',
        name: 'cat.png',
        hash: 'h1',
        previewUrl: placeholderImage,
        isUploaded: false,
        isSelected: true,
        pendingIndex: 0,
      },
      {
        id: 'pending-2',
        name: 'dog.png',
        hash: 'h2',
        previewUrl: placeholderImage,
        isUploaded: false,
        isSelected: false,
        pendingIndex: 1,
      },
      {
        id: 'uploaded-h3',
        name: 'bird.png',
        hash: 'h3',
        previewUrl: '',
        isUploaded: true,
        isSelected: true,
        pendingIndex: null,
      },
    ],
    messageListItems: [
      { role: 'user', content: 'Describe this' },
      { role: 'user', content: 'Compare these two' },
    ],
    rightPanelView: 'files',
    onSelectView: fn(),
    onRemoveAttachment: fn(),
    onToggleAttachment: fn(),
    onPromptClick: fn(),
  },
} satisfies Meta<typeof ChatRightPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Files tab selected with pending and uploaded items. */
export const Files: Story = {};

/** History tab selected. */
export const History: Story = {
  args: { rightPanelView: 'history' },
};
