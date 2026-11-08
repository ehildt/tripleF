import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within } from 'storybook/test';

import { useDebugStore } from '@/stores/debug/debug.store';
import type { DebugResult } from '@/types/debug.model';

import DebugSection from './DebugSection.vue';

const meta = {
  title: 'App/MainContent/DebugSection',
  component: DebugSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Debug section layout: results list and request details side panel.',
      },
    },
  },
} satisfies Meta<typeof DebugSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const failedResult: DebugResult = {
  id: '1',
  epoch: 1,
  endpoint: '/api/v1/harness',
  method: 'POST',
  status: 'error',
  statusCode: 500,
  errorMessage: 'Request failed',
  responseTime: 42,
  type: 'http',
  direction: 'request',
  requestBody: '{"prompt":"Example"}',
  responseBody: '{"error":"Request failed"}',
};

/** Empty debug section. */
export const Empty: Story = {};

/** Debug section after the user selects a result. */
export const WithSelection: Story = {
  decorators: [
    () => {
      useDebugStore().debugResults = [failedResult];
      return { template: '<story />' };
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('/api/v1/harness'));
  },
};
