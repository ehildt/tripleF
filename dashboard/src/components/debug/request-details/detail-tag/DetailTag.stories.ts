import type { Meta, StoryObj } from '@storybook/vue3-vite';

import DetailTag from './DetailTag.vue';

const meta = {
  title: 'Debug/RequestDetails/DetailTag/DetailTag',
  component: DetailTag,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A label + value chip for the property table of the request-details
panel. Hides itself when the value is empty.
`,
      },
    },
  },
  argTypes: {
    field: { control: 'text' },
    value: { control: 'text' },
  },
  args: {
    field: 'requestId',
    value: 'req-abc-123',
  },
} satisfies Meta<typeof DetailTag>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — request id with a label. */
export const Default: Story = {};

/** Numeric value — status code. */
export const StatusCode: Story = { args: { field: 'statusCode', value: 200 } };

/** Boolean-like string — stream. */
export const Stream: Story = { args: { field: 'stream', value: 'true' } };

/** Long value — gets truncated with title hover. */
export const LongValue: Story = {
  args: {
    field: 'requestId',
    value:
      'a-very-long-request-id-that-clearly-exceeds-eighty-characters-and-should-be-truncated-with-an-ellipsis',
  },
};

/** Empty value — renders nothing. */
export const Empty: Story = { args: { value: '' } };
