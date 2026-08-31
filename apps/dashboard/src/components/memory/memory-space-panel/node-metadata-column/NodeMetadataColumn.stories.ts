import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';
import NodeMetadataColumn from './NodeMetadataColumn.vue';

const NODE: ConstellationNode = {
  id: 'a',
  label: 'stellar blade',
  topicKey: 'stellar blade',
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

/**
 * A contested dot: the selected node is party to an open friction, so a
 * warning section lists each conflict's reason between the text and the meta.
 */
export const Contested: Story = {
  args: {
    node: NODE,
    frictions: [
      {
        source: 'a',
        target: 'z',
        reason:
          'One record says Stellar Blade released in 2024, another says 2026 — one is stale.',
      },
    ],
  },
};

/**
 * A synthesized bridge: the selected dot is a derived gap-closer, so a
 * supporting-evidence section lists the facts it cites.
 */
export const Bridge: Story = {
  args: {
    node: {
      id: 'b1',
      label: 'bridge',
      topicKey: 'bridges',
      text: 'The user is migrating to Rust.',
      keys: [],
      isBridge: true,
      evidenceTexts: [
        'I am learning Rust',
        'I am rewriting the payments service',
      ],
    },
  },
};
