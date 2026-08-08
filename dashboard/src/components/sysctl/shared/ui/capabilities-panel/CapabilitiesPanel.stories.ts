import { Coins, Gauge, Wallet } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import CapabilitiesPanel from './CapabilitiesPanel.vue';

const meta = {
  title: 'Sysctl/Shared/CapabilitiesPanel',
  component: CapabilitiesPanel,
  tags: ['autodocs'],
} satisfies Meta<typeof CapabilitiesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Simple key/value account stats. */
export const Rows: Story = {
  args: {
    rows: [
      { icon: Coins, label: 'Credits remaining', value: '51,098' },
      { icon: Gauge, label: 'Requests / minute', value: '50' },
      { icon: Wallet, label: 'Balance', value: '$5.00' },
    ],
  },
};

/** A row tinted with a warning tone. */
export const WarningTone: Story = {
  args: {
    rows: [
      {
        icon: Wallet,
        label: 'Balance',
        value: 'Requires billing permission',
        tone: 'warning',
      },
    ],
  },
};

/** Key/value stats plus an available/not-in-plan status list. */
export const WithStatuses: Story = {
  args: {
    rows: [{ icon: Coins, label: 'Quota remaining', value: '99,905' }],
    statuses: [
      { label: 'Resolve company/index names to tickers', available: true },
      { label: 'Technical indicators (RSI, MACD, ADX)', available: false },
      { label: 'Company fundamentals and valuation', available: false },
    ],
    availableText: 'Available',
    notInPlanText: 'Not in plan',
  },
};
