import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import type { DlqEntry } from '@/types/dlq-entry.model';

import DlqDetailsBody from './DlqDetailsBody.vue';

const baseEntry: DlqEntry = {
  id: 'rec-1',
  jobId: 'job-1',
  jobName: 'req-1',
  queueName: 'harness',
  jobId: 'job-5',
  status: 'Failed',
  payload: {
    filters: {
      model: 'llama3',
      event: 'harness',
      roomId: 'room-1',
      prompt: [
        { role: 'user', content: 'What is in this image?' },
        { role: 'assistant', content: 'A dog.' },
      ],
    },
    meta: [{ name: 'image-a' }],
  },
  failedReason: 'Bad input',
  failedAt: '2024-01-15T12:00:00Z',
  attemptsMade: 1,
  totalAttempts: 3,
  nextRetryAt: null,
  createdAt: '2024-01-14T08:00:00Z',
};

const meta = {
  title: 'Dlq/DetailsBody/DlqDetailsBody',
  component: DlqDetailsBody,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Orchestrator for the right-hand pane of the DLQ panel. Composes the
DlqTopBar, the tabbed navigation (Error / Metadata / Prompt /
Payload), and the per-tab sub-panels (DlqMetadataSection,
DlqPromptSection, etc.). Renders an empty state when no entry is
selected.
`,
      },
    },
  },
  args: {
    entry: baseEntry,
    models: ['llama3', 'mistral'],
    onSavePayload: fn(),
    onSaveQueue: fn(),
  },
} satisfies Meta<typeof DlqDetailsBody>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — Failed entry, Metadata tab active. */
export const Default: Story = {};

/** Empty — no entry selected. */
export const Empty: Story = { args: { entry: null } };

/** Immutable — Removed entry, controls disabled. */
export const Immutable: Story = {
  args: { entry: { ...baseEntry, status: 'Removed' as const } },
};
