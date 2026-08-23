import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import PlaylistToggleButton from './PlaylistToggleButton.vue';

const meta = {
  title: 'Chat/AssistantResponse/Shared/UI/PlaylistToggleButton',
  component: PlaylistToggleButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Playlist membership toggle for video surfaces. The \`active\` prop drives
everything: the add/remove icon, the i18n tooltip/aria label, the pressed
state, and the accent color. The caller owns the playlist state and wires
the \`toggle\` event.
`,
      },
    },
  },
  argTypes: {
    active: { control: 'boolean' },
    size: { control: 'select', options: ['sm', 'lg'] },
  },
  args: {
    active: false,
    onToggle: fn(),
  },
} satisfies Meta<typeof PlaylistToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The video is not in the playlist — shows the add icon. */
export const NotAdded: Story = {};

/** The video is in the playlist — shows the remove icon, pressed + accent. */
export const Added: Story = { args: { active: true } };

/** Compact bar scale for the floating media bar. */
export const Compact: Story = { args: { size: 'sm' } };
