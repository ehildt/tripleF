import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import type { DlqEntry } from '@/types/dlq-entry.model';

import DlqTopBar from './DlqTopBar.vue';

const meta = {
  title: 'Dlq/DetailsBody/TopBar/DlqTopBar',
  component: DlqTopBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The top bar of the DLQ details body. Hosts the model / queue dropdowns,
the event / room ID text fields, the stream flag, and the context size
selector. All controls derive their initial value from
\`payload.filters\` via \`useDlqTopBarFilters\`.
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
      payload: {
        filters: {
          model: 'llama3',
          event: 'harness',
          roomId: 'room-1',
          stream: true,
          numCtx: 4096,
        },
      },
      failedReason: null,
      failedAt: null,
      attemptsMade: 0,
      totalAttempts: 3,
      nextRetryAt: null,
      createdAt: '',
    } as DlqEntry,
    models: ['llama3', 'mistral'],
    isImmutable: false,
    onUpdateFilter: fn(),
    onSaveQueue: fn(),
  },
} satisfies Meta<typeof DlqTopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — fully populated filters. */
export const Default: Story = {};

/** Immutable (Removed entry) — all controls disabled. */
export const Immutable: Story = { args: { isImmutable: true } };

/** Missing model — model is errored. */
export const MissingModel: Story = {
  args: {
    entry: {
      ...meta.args.entry,
      payload: {
        filters: { model: 'gone-fishing' },
      },
    } as DlqEntry,
    models: ['llama3'],
  },
};
