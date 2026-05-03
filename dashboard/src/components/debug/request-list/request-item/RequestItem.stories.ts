import type { Meta, StoryObj } from '@storybook/vue3-vite';

import RequestItem from './RequestItem.vue';

const meta = {
  title: 'Debug/RequestList/RequestItem/RequestItem',
  component: RequestItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A single row in the request list. Renders the type, direction, status,
method, identifier (requestId or endpoint), and model. Fades out when
read unless it's the active row.
`,
      },
    },
  },
  argTypes: {
    isRead: { control: 'boolean' },
    isActive: { control: 'boolean' },
  },
  args: {
    isRead: false,
    isActive: false,
  },
} satisfies Meta<typeof RequestItem>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleHttp = {
  id: '1',
  timestamp: '',
  endpoint: '/api/v1/harness',
  method: 'POST',
  status: 'success' as const,
  responseTime: 42,
  type: 'http' as const,
  direction: 'request' as const,
  model: 'llama3.2',
  requestId: 'req-abc-123',
};

const sampleError = {
  ...sampleHttp,
  status: 'error' as const,
  errorMessage: 'Server error',
};

/** Unread, inactive row — full opacity. */
export const Unread: Story = { args: { result: sampleHttp } };

/** Read, inactive row — fades out. */
export const Read: Story = {
  args: { result: sampleHttp, isRead: true },
};

/** Read, active — full opacity even when read. */
export const ReadActive: Story = {
  args: { result: sampleHttp, isRead: true, isActive: true },
};

/** Error row. */
export const ErrorRow: Story = { args: { result: sampleError } };

/** Socket row. */
export const Socket: Story = {
  args: {
    result: {
      ...sampleHttp,
      type: 'socket' as const,
      roomId: 'room-1',
      event: 'harness',
    },
  },
};
