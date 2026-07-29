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
Single capability marker. Known capabilities render as a muted icon with the
capability label as tooltip — identical to the icons in the model selector
dropdown. Unknown capability strings fall back to the text badge. Used by
CapabilitiesRow for the currently selected model.`,
      },
    },
  },
  argTypes: {
    capability: { control: 'text' },
  },
  args: {
    capability: 'vision',
  },
} satisfies Meta<typeof CapabilityBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Known capability — icon with label tooltip (vision). */
export const Vision: Story = {};

/** Known capability — wrench icon for tools. */
export const Tools: Story = {
  args: { capability: 'tools' },
};

/** Known capability — waveform icon for audio. */
export const Audio: Story = {
  args: { capability: 'audio' },
};

/** Unknown capability — falls back to the text badge. */
export const UnknownTextFallback: Story = {
  args: { capability: 'insert' },
};
