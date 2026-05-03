import { SlidersHorizontal } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import PprocSection from './PprocSection.vue';

const meta = {
  title: 'Pproc/Shared/UI/Section/PprocSection',
  component: PprocSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Section header inside the preprocessing panel. Renders an icon and a
title in monospace, with an optional action slot on the right.
`,
      },
    },
  },
  args: {
    icon: SlidersHorizontal,
    title: 'Advanced Parameters',
  },
} satisfies Meta<typeof PprocSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default section with body content. */
export const Default: Story = {
  render: (args) => ({
    components: { PprocSection },
    setup: () => ({ args }),
    template: `
      <PprocSection :icon="args.icon" :title="args.title">
        <div class="text-fg-muted text-xs font-mono">Section body</div>
      </PprocSection>
    `,
  }),
};

/** Section with an action button on the right. */
export const WithAction: Story = {
  render: (args) => ({
    components: { PprocSection },
    setup: () => ({ args }),
    template: `
      <PprocSection :icon="args.icon" :title="args.title">
        <template #action>
          <button class="text-fg-muted hover:text-fg-primary text-xs font-mono">
            Reset
          </button>
        </template>
        <div class="text-fg-muted text-xs font-mono">Section body</div>
      </PprocSection>
    `,
  }),
};
