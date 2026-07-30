import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import TabPanel, { type TabPanelTab } from './TabPanel.vue';

const tabs: TabPanelTab[] = [
  { id: 'body', label: 'Body' },
  { id: 'headers', label: 'Headers' },
  { id: 'response', label: 'Response' },
];

const meta = {
  title: 'Shared/UI/TabPanel',
  component: TabPanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Reusable tabbed panel with an optional copy button and a no-selection hint.

Tabs are rendered as a full-width bar; the active tab overlays the panel
border. The parent controls the active tab and the panel slot content.
`,
      },
    },
  },
  args: {
    tabs,
    activeTab: 'body',
    copyable: true,
    copied: false,
    onSelect: fn(),
    onCopy: fn(),
  },
} satisfies Meta<typeof TabPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default tab panel with a copy button. */
export const Default: Story = {
  render: (args) => ({
    components: { TabPanel },
    setup() {
      return { args };
    },
    template: `
      <TabPanel v-bind="args" style="height: 12rem">
        <pre style="margin:0; padding:1rem; font-family: var(--font-mono); font-size: 0.75rem;">
{\n  "ok": true\n}</pre>
      </TabPanel>
    `,
  }),
};

/** Tab panel with no active tab selected. */
export const NoSelection: Story = {
  args: { activeTab: null },
};

/** Tab panel with the copy button showing its copied state. */
export const Copied: Story = {
  args: { copied: true },
};
