import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type {
  ConstellationLink,
  ConstellationNode,
} from './MemoryConstellation.types';
import MemoryConstellation from './MemoryConstellation.vue';

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
  {
    id: 'c',
    label: 'works at Acme',
    clusterKey: 'work',
    text: 'User works at Acme',
    keys: ['work'],
  },
  {
    id: 'd',
    label: 'rust developer',
    clusterKey: 'work',
    text: 'User is a rust developer',
    keys: ['work', 'rust'],
  },
];

const LINKS: ConstellationLink[] = [
  { source: 'a', target: 'b', type: 'entity' },
  { source: 'c', target: 'd', type: 'entity' },
];

const meta = {
  title: 'Sysctl/MemorySection/MemoryConstellation',
  component: MemoryConstellation,
  tags: ['autodocs'],
  args: { nodes: NODES, links: LINKS, height: 480 },
} satisfies Meta<typeof MemoryConstellation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two clusters (likes / work) of dots in a 3D space. */
export const Default: Story = {};

/** No dots — the canvas renders an empty field. */
export const Empty: Story = {
  args: { nodes: [], links: [] },
};

/**
 * Two game clusters sharing the `games` category form a category hub that
 * connects to the ZERO root, the strong same-category link (0.85) draws a
 * solid sibling edge between the two sub-categories, and the weak dog↔game
 * link (0.55, below the 0.7 bar) draws nothing.
 */
export const GameCommunity: Story = {
  args: {
    nodes: [
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `nte-${i}`,
        label: `nte fact ${i}`,
        clusterKey: 'nte',
        communityKey: 'games',
        text: `NTE fact ${i}`,
        keys: ['nte'],
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `waves-${i}`,
        label: `waves fact ${i}`,
        clusterKey: 'wuthering waves',
        communityKey: 'games',
        text: `Wuthering Waves fact ${i}`,
        keys: ['wuthering waves'],
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `dog-${i}`,
        label: `dog fact ${i}`,
        clusterKey: 'dog',
        communityKey: 'pets',
        text: `Dog fact ${i}`,
        keys: ['dog'],
      })),
    ],
    links: [
      { source: 'nte-0', target: 'waves-0', type: 'semantic', score: 0.85 },
      { source: 'nte-0', target: 'dog-0', type: 'semantic', score: 0.55 },
    ],
  },
};
