import { Brain } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type {
  ConstellationLink,
  ConstellationNode,
} from '../memory-constellation/MemoryConstellation.types';
import MemorySpacePanel from './MemorySpacePanel.vue';

const NODES: ConstellationNode[] = [
  {
    id: 'a',
    label: 'likes cars',
    clusterKey: 'likes',
    text: 'User likes cars',
    keys: ['likes'],
  },
  {
    id: 'b',
    label: 'likes music',
    clusterKey: 'likes',
    text: 'User likes music',
    keys: ['likes'],
  },
];

const LINKS: ConstellationLink[] = [
  { source: 'a', target: 'b', type: 'entity' },
];

const meta = {
  title: 'Sysctl/MemorySection/MemorySpacePanel',
  component: MemorySpacePanel,
  tags: ['autodocs'],
  args: {
    icon: Brain,
    label: 'Memory partition',
    description: 'Your stored fact records',
    nodes: NODES,
    links: LINKS,
    isLoading: false,
    isUnavailable: false,
    isEmpty: false,
    emptyText: 'Nothing stored yet',
    unavailableText: 'Memory is off or unreachable',
  },
} satisfies Meta<typeof MemorySpacePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Populated constellation. */
export const Default: Story = {};

/** Nothing stored yet. */
export const Empty: Story = {
  args: { nodes: [], links: [], isEmpty: true },
};

/** Memory off or unreachable. */
export const Unavailable: Story = {
  args: { nodes: [], links: [], isUnavailable: true },
};
