import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import AppMainContent from './AppMainContent.vue';

const meta = {
  title: 'App/MainContent',
  component: AppMainContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Main content orchestrator that renders the active tab section.',
      },
    },
  },
  argTypes: {
    activeTab: { control: 'select' },
  },
  args: {
    activeTab: 'http',
    socketProvider: {} as any,
    models: ['llama', 'mistral'],
    debugResults: [],
    selectedDebugResult: null,
    onRefreshModels: fn(),
    onClearDebugResults: fn(),
    onSelectDebugResult: fn(),
    onSelectDebugMarkRead: fn(),
  },
} satisfies Meta<typeof AppMainContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Chat is the default tab. */
export const Chat: Story = {};

/** Dead letter queue section. */
export const Dlq: Story = {
  args: { activeTab: 'dlq' },
};

/** Debug section. */
export const Debug: Story = {
  args: {
    activeTab: 'debug',
    debugResults: [{ id: '1', message: 'Sample debug entry' }],
  },
};

/** Preprocessing section. */
export const Preprocessing: Story = {
  args: { activeTab: 'preprocessing' },
};

/** Sysctl section. */
export const SysCtl: Story = {
  args: { activeTab: 'sysctl' },
};
