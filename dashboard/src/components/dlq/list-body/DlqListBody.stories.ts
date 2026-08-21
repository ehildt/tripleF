import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import DlqListBody from './DlqListBody.vue';

const makeEntry = (
  id: string,
  status: 'Failed' | 'Active' | 'Cleared' | 'Removed' = 'Failed',
): any => ({
  id,
  jobId: `job-${id}`,
  jobName: id,
  queueName: 'harness',
  jobId: null,
  status,
  payload: null,
  failedReason: null,
  failedAt: `2024-01-0${Number(id.slice(-1)) + 1}T00:00:00Z`,
  attemptsMade: 1,
  totalAttempts: 3,
  nextRetryAt: null,
  createdAt: '',
});

const meta = {
  title: 'Dlq/ListBody/DlqListBody',
  component: DlqListBody,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Renders the list of DLQ entries: an error state, an empty state, or a
scrollable list of \`DlqItemRow\` items. Sorting and read-state filtering
are handled by the \`useDlqListState\` composable, which delegates the
pure sort logic to a helper.
`,
      },
    },
  },
  args: {
    entries: [makeEntry('a'), makeEntry('b'), makeEntry('c')],
    selectedEntryId: null,
    error: null,
    hideRead: false,
    sortTrigger: 0,
    isEntryRead: () => false,
    onSelect: fn(),
    onRetry: fn(),
    onArchive: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof DlqListBody>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — three entries, none selected. */
export const Default: Story = {};

/** One entry selected — accent-tinted row. */
export const Selected: Story = {
  args: { selectedEntryId: 'a' },
};

/** Error state. */
export const ErrorState: Story = {
  args: { entries: [], error: 'Failed to load DLQ entries' },
};

/** Empty DLQ. */
export const Empty: Story = { args: { entries: [] } };

/** No unread entries — all read but hideRead is false. */
export const AllRead: Story = {
  args: { isEntryRead: () => true },
};
