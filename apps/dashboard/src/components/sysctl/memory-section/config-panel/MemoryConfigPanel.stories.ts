import type { Meta, StoryObj } from '@storybook/vue3-vite';

import MemoryConfigPanel from './MemoryConfigPanel.vue';

const meta = {
  title: 'Sysctl/MemorySection/MemoryConfigPanel',
  component: MemoryConfigPanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The Memory tab's configuration panel: renders one configuration group at a
time (spaces, short-term memory probe, cognition profile, constellation
diagram, maintenance models, auto-triggers, sweep limits), selected by the
icon submenu in MemorySection.`,
      },
    },
  },
  args: { activeGroup: 'spaces' },
  argTypes: {
    activeGroup: {
      control: 'select',
      options: [
        'spaces',
        'episodeProbe',
        'cognitionProfile',
        'constellationDiagram',
        'maintenanceModels',
        'autoTriggers',
        'sweepLimits',
      ],
    },
  },
} satisfies Meta<typeof MemoryConfigPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The memory configuration group currently selected in the submenu. */
export const Default: Story = {};
