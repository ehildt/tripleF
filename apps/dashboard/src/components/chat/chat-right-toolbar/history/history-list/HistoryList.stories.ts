import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { Mock } from 'vitest';
import { ref } from 'vue';

import type { HistoryListItemData } from './HistoryList.types';
import HistoryList from './HistoryList.vue';

const prompts: HistoryListItemData[] = [
  {
    id: 'u1',
    role: 'user',
    content:
      'What is the difference between supervised and unsupervised learning?',
    included: true,
    contextPercent: '12.50',
  },
  {
    id: 'u2',
    role: 'user',
    content: 'Can you give a real-world example of each?',
    included: true,
    mergeSelected: true,
  },
  {
    id: 'u3',
    role: 'user',
    content: 'Show me how to evaluate the model afterwards.',
    included: false,
    contextPercent: '8.10',
  },
];

const meta = {
  title: 'Chat/Right Toolbar/History/History List',
  component: HistoryList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The history panel's row list: one compact row per user prompt. Clicking a row
jumps the exchange list to that prompt; the per-row actions copy, include/
exclude, merge-select, branch, and delete the prompt. The active row scrolls
its preview as a marquee.
        `,
      },
    },
  },
  argTypes: {
    items: { control: 'object' },
    activeId: { control: 'text' },
    iconVisibility: { control: 'object' },
    canMerge: { control: 'boolean' },
    mergeArmed: { control: 'boolean' },
  },
  args: {
    items: prompts,
    activeId: null,
    iconVisibility: undefined,
    canMerge: true,
    mergeArmed: false,
    onSelect: fn(),
    onCopy: fn(),
    onToggleInclude: fn(),
    onToggleMerge: fn(),
    onDeleteItem: fn(),
    onBranchOut: fn(),
  },
  render: (args: any) => ({
    components: { HistoryList },
    setup() {
      const items = ref(args.items);
      return { args, items };
    },
    template: `
      <HistoryList
        :items="items"
        :active-id="args.activeId"
        :icon-visibility="args.iconVisibility"
        :can-merge="args.canMerge"
        :merge-armed="args.mergeArmed"
        @select="args.onSelect"
        @copy="args.onCopy"
        @toggle-include="args.onToggleInclude"
        @toggle-merge="args.onToggleMerge"
        @delete-item="args.onDeleteItem"
        @branch-out="args.onBranchOut"
      />
    `,
  }),
} satisfies Meta<typeof HistoryList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SeveralPrompts: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Three prompts: an included prompt with a context percent, a merge-selected prompt, and an excluded prompt (dimmed).',
      },
    },
  },
};

export const ActivePrompt: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The active prompt scrolls its preview as a marquee and carries the accent ring.',
      },
    },
  },
  args: {
    activeId: 'u2',
  },
};

export const MergeArmed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'At least two prompts are selected for a merge: the selected merge icons pulse.',
      },
    },
  },
  args: {
    mergeArmed: true,
  },
};

export const MergeConsumed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A prompt consumed by a completed merge: purple row tint and a red merge icon with the merged-request hint.',
      },
    },
  },
  args: {
    items: [
      {
        id: 'u1',
        role: 'user',
        content: 'Explain attention heads.',
        included: true,
        merged: true,
        mergedRequestId: 'req-42',
      },
      {
        id: 'u2',
        role: 'user',
        content: 'Now combine them into a single response.',
        included: true,
      },
    ],
  },
};

export const MergeDisabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Fewer than two merge candidates: every merge icon is grayed out and inert.',
      },
    },
  },
  args: {
    canMerge: false,
  },
};

export const IconsHidden: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The settings icon-visibility options hide the copy, include, branch, and delete actions; the merge icon is not part of that visibility set.',
      },
    },
  },
  args: {
    iconVisibility: {
      copy: false,
      include: false,
      branch: false,
      delete: false,
    },
  },
};

export const InteractionTest: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Verifies the row contract: clicking a row emits select with its index; the action buttons emit their own events without firing select.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const onSelect = args.onSelect as Mock;
    const onCopy = args.onCopy as Mock;
    const onToggleMerge = args.onToggleMerge as Mock;
    onSelect.mockClear();
    onCopy.mockClear();
    onToggleMerge.mockClear();

    const rows = canvas.getAllByText(/prompt|learning|example|evaluate/i);
    await expect(rows.length).toBeGreaterThan(0);

    await userEvent.click(rows[0]);
    await expect(onSelect).toHaveBeenCalledWith(0);

    const copy = canvas.getByRole('button', { name: 'Copy' });
    await userEvent.click(copy);
    await expect(onCopy).toHaveBeenCalledWith(0);
    await expect(onSelect).toHaveBeenCalledTimes(1);
  },
};
