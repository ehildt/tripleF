import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SourceTagsStrip from './SourceTagsStrip.vue';

const meta = {
  title: 'Chat/PromptActionBar/SourceTagsStrip',
  component: SourceTagsStrip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Positioning shell for the icon menus floating on the prompt bar's top border.
Holds whatever the orchestrator puts in its default slot.
`,
      },
    },
  },
} satisfies Meta<typeof SourceTagsStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Strip with two sample menu placeholders inside. */
export const WithMenus: Story = {
  render: () => ({
    components: { SourceTagsStrip },
    template: `
      <div style="position: relative; height: 6rem; background: var(--color-bg-tertiary);">
        <SourceTagsStrip>
          <span style="color: var(--color-accent-primary);">●</span>
          <span style="color: var(--color-status-info);">●</span>
        </SourceTagsStrip>
      </div>`,
  }),
};
