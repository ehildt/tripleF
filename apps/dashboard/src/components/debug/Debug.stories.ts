import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import type { DebugResult } from '../../types/debug.model';
import Debug from './Debug.vue';

const meta = {
  title: 'Debug/Debug',
  component: Debug,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Main request-log panel. Owns the filter and hide-read state, wires the
debug store, and composes the header, request list, and empty states.
`,
      },
    },
  },
  args: {
    results: [],
    selectedResult: null,
    onClear: fn(),
    onSelect: fn(),
    onMarkRead: fn(),
  },
} satisfies Meta<typeof Debug>;

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
    model: 'llama3.2',
  },
  {
    id: '2',
    timestamp: '',
    endpoint: 'socket.io:harness:room-1:{}',
    method: 'GET',
    status: 'success',
    responseTime: 5,
    type: 'socket',
    direction: 'request',
    requestId: 'req-2',
    roomId: 'room-1',
    event: 'harness',
  },
];

/** Empty request log. */
export const Empty: Story = {};

/** Populated request log with a selection. */
export const WithResults: Story = {
  args: { results: sampleResults, selectedResult: sampleResults[0] },
};
