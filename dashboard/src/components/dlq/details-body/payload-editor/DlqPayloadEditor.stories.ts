import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import DlqPayloadEditor from './DlqPayloadEditor.vue';

const meta = {
  title: 'Dlq/DetailsBody/PayloadEditor/DlqPayloadEditor',
  component: DlqPayloadEditor,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Read-only or edit-in-place view of a DLQ entry's payload. Click the
preformatted block to enter edit mode, edit the JSON, then confirm or
cancel with the toolbar buttons.
`,
      },
    },
  },
  args: {
    entry: {
      requestId: 'req-1',
      queueName: 'harness',
      jobId: null,
      status: 'Failed',
      payload: { filters: { model: 'llama3', stream: true } },
      failedReason: null,
      failedAt: null,
      attemptsMade: 1,
      totalAttempts: 3,
      nextRetryAt: null,
      createdAt: '',
    },
    isImmutable: false,
    showBack: false,
    scrollable: false,
    onSavePayload: fn(),
    onBack: fn(),
  },
} satisfies Meta<typeof DlqPayloadEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Read-only display. */
export const ReadOnly: Story = {};

/** Immutable (Removed entries) — no edit affordances. */
export const Immutable: Story = { args: { isImmutable: true } };

/** With the back button. */
export const WithBackButton: Story = { args: { showBack: true } };

/** Scrollable, taller layout. */
export const Scrollable: Story = { args: { scrollable: true } };
