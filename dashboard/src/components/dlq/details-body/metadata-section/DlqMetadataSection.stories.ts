import type { Meta, StoryObj } from '@storybook/vue3-vite';

import DlqMetadataSection from './DlqMetadataSection.vue';

const meta = {
  title: 'Dlq/DetailsBody/MetadataSection/DlqMetadataSection',
  component: DlqMetadataSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The Metadata tab of the DLQ details body — renders the entry's job ID,
status, timestamps, attempt count, image count, and context size as a
stack of \`DlqMetadataField\` rows.
`,
      },
    },
  },
  args: {
    entry: {
      requestId: 'req-1',
      queueName: 'harness',
      jobId: 'job-5',
      status: 'Failed',
      payload: {
        meta: [{ name: 'image-a' }, { name: 'image-b' }],
        filters: { numCtx: 4096 },
      },
      failedReason: null,
      failedAt: '2024-01-15T12:00:00Z',
      attemptsMade: 1,
      totalAttempts: 3,
      nextRetryAt: '2024-01-16T12:00:00Z',
      createdAt: '2024-01-14T08:00:00Z',
    },
  },
} satisfies Meta<typeof DlqMetadataSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — fully populated Failed entry. */
export const Default: Story = {};

/** Without a nextRetryAt timestamp. */
export const NoRetry: Story = {
  args: {
    entry: {
      requestId: 'req-1',
      queueName: 'harness',
      jobId: 'job-5',
      status: 'Active',
      payload: { meta: [], filters: {} },
      failedReason: null,
      failedAt: null,
      attemptsMade: 0,
      totalAttempts: 0,
      nextRetryAt: null,
      createdAt: '2024-01-14T08:00:00Z',
    },
  },
};
