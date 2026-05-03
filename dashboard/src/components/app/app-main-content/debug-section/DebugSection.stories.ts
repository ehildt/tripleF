import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

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
  args: {
    debugResults: [],
    selectedDebugResult: null,
    onClearDebugResults: fn(),
    onSelectDebugResult: fn(),
    onSelectDebugMarkRead: fn(),
  },
} satisfies Meta<typeof DebugSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty debug section. */
export const Empty: Story = {};

/** Debug section with selected result. */
export const WithSelection: Story = {
  args: {
    debugResults: [{ id: '1', message: 'Request failed' }],
    selectedDebugResult: { id: '1', message: 'Request failed' },
  },
};
