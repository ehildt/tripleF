import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import DlqItemRow from './DlqItemRow.vue';

const baseEntry = {
  requestId: 'req-1',
  queueName: 'harness',
  jobId: 'job-5',
  status: 'Failed' as const,
  payload: null,
  failedReason: null,
  failedAt: '2024-01-15T12:00:00Z',
  attemptsMade: 1,
  totalAttempts: 3,
  nextRetryAt: null,
  createdAt: '2024-01-14T08:00:00Z',
};

const meta = {
  title: 'Dlq/ItemRow/DlqItemRow',
  component: DlqItemRow,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A single row in the DLQ list. Renders the request ID, status badge,
meta row (queue, attempts, failed-at), and the action buttons (retry /
archive / delete) gated by the entry's status.
`,
      },
    },
  },
  args: {
    entry: baseEntry,
    isRead: false,
    isActive: false,
    onRetry: fn(),
    onArchive: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof DlqItemRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — Failed entry with all three actions visible. */
export const Default: Story = {};

/** Active row — the accent-tinted background for the selected entry. */
export const Active: Story = { args: { isActive: true } };

/** Read but not active — dimmed to indicate it's already been seen. */
export const Read: Story = { args: { isRead: true } };

/** Cleared — archive hidden, retry visible. */
export const Cleared: Story = {
  args: { entry: { ...baseEntry, status: 'Cleared' } },
};

/** Removed — no actions available. */
export const Removed: Story = {
  args: { entry: { ...baseEntry, status: 'Removed' } },
};
