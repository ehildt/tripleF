import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import SpaceSelector from './SpaceSelector.vue';

const meta = {
  title: 'Settings/SystemSection/SpaceSelector',
  component: SpaceSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The memory-cognition space picker for the settings System tab — modeled on the
language menu: a trigger button plus a teleported dropdown with a sticky
search/create input and the history list. Selecting activates a space, typing
an unknown name creates it, the per-item X drops a space from the list (never
wiping its data), and the default pseudo-option restores the empty value
(cognition lives in the memory partition).

Presentational only: the active space, history contents, and persistence live
in the app store; \`select\` / \`create\` / \`remove\` events carry the space id.
`,
      },
    },
  },
  args: {
    activeSpace: 'alice',
    spaces: ['alice', 'research-assistant', 'work'],
    onSelect: fn(),
    onCreate: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof SpaceSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A populated history with an active space. Click the trigger to open. */
export const Default: Story = {};

/** The default (empty) state — no cognition space selected yet. */
export const DefaultSpace: Story = {
  args: { activeSpace: '', spaces: ['alice'] },
};

/** No history yet — the dropdown shows the empty note plus create affordance. */
export const EmptyHistory: Story = {
  args: { activeSpace: '', spaces: [] },
};
