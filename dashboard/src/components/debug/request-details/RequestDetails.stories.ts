import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { DebugResult } from '../../../types/debug.model';
import RequestDetails from './RequestDetails.vue';

const meta = {
  title: 'Debug/RequestDetails/RequestDetails',
  component: RequestDetails,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Right-side details panel for the selected request. Renders a property
table of metadata (URL, tokens, timing, channels, model) and a tab list
showing the error, prompt, params, headers, body, or response.
`,
      },
    },
  },
  args: {
    result: null,
  },
} satisfies Meta<typeof RequestDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleHttp: DebugResult = {
  id: '1',
  timestamp: '',
  endpoint: '/api/v1/harness?key=val',
  method: 'POST',
  status: 'success',
  statusCode: 200,
  responseTime: 42,
  totalDuration: 1_500_000_000,
  type: 'http',
  direction: 'request',
  model: 'llama3.2',
  stream: true,
  numCtx: '8192',
  promptEvalCount: 100,
  evalCount: 50,
  requestHeaders: { 'x-harness-llm': 'llama' },
  requestBody: '{"prompt":"Describe this"}',
  responseBody: '{"ok":true}',
};

const sampleSocket: DebugResult = {
  id: '2',
  timestamp: '',
  endpoint: 'socket.io:harness:room-1:{}',
  method: 'GET',
  status: 'success',
  responseTime: 5,
  type: 'socket',
  direction: 'request',
  requestId: 'req-socket-1',
  roomId: 'room-1',
  event: 'harness',
  conversationId: 'conversation-1',
};

const sampleError: DebugResult = {
  ...sampleHttp,
  id: '3',
  status: 'error',
  errorMessage: 'Server error: model not loaded',
};

/** No result selected — empty state. */
export const Empty: Story = {};

/** HTTP success with full metadata, headers, body, and response. */
export const HttpSuccess: Story = { args: { result: sampleHttp } };

/** Socket result. */
export const Socket: Story = { args: { result: sampleSocket } };

/** Error result with an error message tab. */
export const ErrorState: Story = { args: { result: sampleError } };
