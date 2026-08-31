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
    topicKey: 'likes',
    text: 'User likes cars',
    keys: ['likes'],
  },
  {
    id: 'b',
    label: 'likes music',
    topicKey: 'likes',
    text: 'User likes music',
    keys: ['likes'],
  },
  {
    id: 'c',
    label: 'works at Acme',
    topicKey: 'work',
    text: 'User works at Acme',
    keys: ['work'],
  },
  {
    id: 'd',
    label: 'rust developer',
    topicKey: 'work',
    text: 'User is a rust developer',
    keys: ['work', 'rust'],
  },
];

const LINKS: ConstellationLink[] = [
  { source: 'a', target: 'b', type: 'entity' },
  { source: 'c', target: 'd', type: 'entity' },
];

const meta = {
  title: 'Memory/MemoryConstellation',
  component: MemoryConstellation,
  tags: ['autodocs'],
  args: { nodes: NODES, links: LINKS, height: 480 },
} satisfies Meta<typeof MemoryConstellation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two topics (likes / work) of dots in a 3D space. */
export const Default: Story = {};

/** No dots — the canvas renders an empty field. */
export const Empty: Story = {
  args: { nodes: [], links: [] },
};

/**
 * An open friction between two dots (a ↔ c) — the reflection pass's
 * contested pair renders as a dashed orange warning edge, distinct from the
 * gray hierarchy edges and the topic-colored semantic links.
 */
export const Friction: Story = {
  args: {
    nodes: NODES,
    links: LINKS,
    frictions: [
      { source: 'a', target: 'c', reason: 'conflicting statements about work' },
    ],
  },
};

/**
 * Two game topics sharing the `games` category form a category hub that
 * connects to the ZERO root, the strong same-category link (0.85) draws a
 * solid sibling edge between the two sub-categories, and the weak dog↔game
 * link (0.55, below the 0.7 bar) draws nothing.
 */
export const GameCluster: Story = {
  args: {
    nodes: [
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `nte-${i}`,
        label: `nte fact ${i}`,
        topicKey: 'nte',
        clusterKey: 'games',
        text: `NTE fact ${i}`,
        keys: ['nte'],
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `waves-${i}`,
        label: `waves fact ${i}`,
        topicKey: 'wuthering waves',
        clusterKey: 'games',
        text: `Wuthering Waves fact ${i}`,
        keys: ['wuthering waves'],
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `dog-${i}`,
        label: `dog fact ${i}`,
        topicKey: 'dog',
        clusterKey: 'pets',
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
