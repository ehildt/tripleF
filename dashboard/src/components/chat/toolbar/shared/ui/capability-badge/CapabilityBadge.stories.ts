import type { Meta, StoryObj } from '@storybook/vue3-vite';

import CapabilityBadge from './CapabilityBadge.vue';

const meta = {
  title: 'Chat/Toolbar/Shared/UI/CapabilityBadge/CapabilityBadge',
  component: CapabilityBadge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Single capability tag shown as a small badge. Used by CapabilitiesRow to render all
capabilities of the currently selected model.`,
      },
    },
  },
  argTypes: {
    capability: { control: 'text' },
  },
  args: {
    capability: 'tool-use',
  },
} satisfies Meta<typeof CapabilityBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state. */
export const Default: Story = {};

/** A common text-generation capability label. */
export const TextGeneration: Story = {
  args: { capability: 'text-generation' },
};
