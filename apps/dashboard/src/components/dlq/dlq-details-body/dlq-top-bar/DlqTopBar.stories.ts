import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import { useModelsStore } from '@/stores/models';
import type { DlqEntry } from '@/types/dlq-entry.model';

import DlqTopBar from './DlqTopBar.vue';

function renderStory(args: Record<string, unknown>) {
  return {
    components: { DlqTopBar },
    setup() {
      const modelsStore = useModelsStore();
      modelsStore.models = [
        { model: 'llama3', parameter_size: '8B', context_length: 131072 },
        { model: 'mistral', parameter_size: '7B', context_length: 32768 },
      ];
      modelsStore.numCtxOptions = [4096, 8192, 16384, 32768];
      return { args };
    },
    template: '<DlqTopBar v-bind="args" />',
  };
}

const meta = {
  title: 'Dlq/DlqDetailsBody/DlqTopBar/DlqTopBar',
  component: DlqTopBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The top bar of the DLQ details body. Hosts the model / context dropdowns,
the event / room ID text fields, and the stream flag. The model field opens
the shared searchable model list; all controls derive their initial value
from \`payload.filters\` via \`useDlqTopBarFilters\`.
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
  },
  render: renderStory,
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
