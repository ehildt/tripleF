import type { Meta, StoryObj } from '@storybook/vue3-vite';

import PanelEmptyState from './PanelEmptyState.vue';

const meta = {
  title: 'Shared/UI/PanelEmptyState/PanelEmptyState',
  component: PanelEmptyState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Centered shield icon and two-line message for an empty panel. The
defaults match the request-log empty state.
`,
      },
    },
  },
  argTypes: {
    message: { control: 'text' },
    submessage: { control: 'text' },
  },
  args: {
    message: 'No requests yet',
    submessage: 'Send a request to see results',
  },
} satisfies Meta<typeof PanelEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — fallback message and submessage. */
export const Default: Story = {};

/** Custom message and submessage. */
export const CustomMessage: Story = {
  args: {
    message: 'No unread jobs',
    submessage: 'Toggle the eye icon to show all jobs',
  },
};

/** Message only. */
export const MessageOnly: Story = { args: { submessage: '' } };
