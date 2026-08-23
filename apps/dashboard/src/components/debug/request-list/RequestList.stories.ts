import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import type { DebugResult } from '../../../types/debug.model';
import RequestList from './RequestList.vue';

const meta = {
  title: 'Debug/RequestList/RequestList',
  component: RequestList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Scrollable list of request rows. Selecting a row emits a select event.
Fades read rows and highlights the active selection.
`,
      },
    },
  },
  args: {
    selectedResultId: '',
    isRead: () => false,
    onSelect: fn(),
  },
} satisfies Meta<typeof RequestList>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleResults: DebugResult[] = [
  {
    id: '1',
    timestamp: '',
    endpoint: '/api/v1/harness',
    method: 'POST',
    status: 'success',
    responseTime: 42,
    type: 'http',
    direction: 'request',
    requestId: 'req-1',
    model: 'llama3.2',
  },
  {
    id: '2',
    timestamp: '',
    endpoint: '/api/v1/health',
    method: 'GET',
    status: 'error',
    responseTime: 12,
    type: 'http',
    direction: 'request',
  },
  {
    id: '3',
    timestamp: '',
    endpoint: 'socket.io:harness:room-1:{}',
    method: 'GET',
    status: 'success',
    responseTime: 5,
    type: 'socket',
    direction: 'request',
    requestId: 'req-3',
    roomId: 'room-1',
    event: 'harness',
  },
];

/** Default list with mixed http/socket results. */
export const Default: Story = {
  args: { results: sampleResults },
};

/** Empty list. */
export const Empty: Story = { args: { results: [] } };

/** First row is selected. */
export const WithSelection: Story = {
  args: { results: sampleResults, selectedResultId: '1' },
};

/** All rows read — they appear faded. */
export const AllRead: Story = {
  args: { results: sampleResults, isRead: () => true },
};
