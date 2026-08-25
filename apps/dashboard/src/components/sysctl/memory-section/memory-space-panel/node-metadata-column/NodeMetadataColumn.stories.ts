import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';
import NodeMetadataColumn from './NodeMetadataColumn.vue';

const NODE: ConstellationNode = {
  id: 'a',
  label: 'stellar blade',
  clusterKey: 'stellar blade',
  text: 'Stellar Blade is an action game released in 2024.',
  keys: ['stellar blade'],
  meta: [
    { label: 'category', value: 'games' },
    { label: 'created', value: '2025-01-12' },
  ],
};

const meta = {
  title: 'Sysctl/MemorySection/NodeMetadataColumn',
  component: NodeMetadataColumn,
  tags: ['autodocs'],
  args: { node: NODE },
} satisfies Meta<typeof NodeMetadataColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A selected dot's details. */
export const Selected: Story = {};

/** Nothing selected yet. */
export const Empty: Story = {
  args: { node: null },
};
