import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { DlqEntry } from '@/types/dlq-entry.model';

import DlqPromptSection from './DlqPromptSection.vue';

const meta = {
  title: 'Dlq/DetailsBody/PromptSection/DlqPromptSection',
  component: DlqPromptSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The Prompt tab of the DLQ details body. Reuses the shared
\`ExpandableMessageList\`/\`ExpandableMessageListBody\` components to render the entry's prompt
messages (extracted from \`payload.filters.prompt\`).
`,
      },
    },
  },
  args: {
    entry: {
      id: 'rec-1',
      jobId: 'job-1',
      jobName: 'req-1',
      queueName: 'harness',
      jobId: null,
      status: 'Failed',
      payload: {
        filters: {
          prompt: [
            { role: 'user', content: 'What is in this image?' },
            { role: 'assistant', content: 'A dog.' },
          ],
        },
      },
      failedReason: null,
      failedAt: null,
      attemptsMade: 0,
      totalAttempts: 3,
      nextRetryAt: null,
      createdAt: '',
    } as DlqEntry,
  },
} satisfies Meta<typeof DlqPromptSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — multi-message prompt. */
export const Default: Story = {};

/** No prompt on the entry. */
export const NoPrompt: Story = {
  args: {
    entry: {
      ...meta.args.entry,
      payload: {},
    } as DlqEntry,
  },
};
