import { Mail, Search, Trash2 } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import IconButton from './IconButton.vue';

const meta = {
  title: 'Shared/UI/IconButton/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A small icon-only button with hover/active/danger/armed states, used for
toolbar and header actions. The icon is provided through the default slot.
`,
      },
    },
  },
  args: {
    title: 'Action',
    onClick: fn(),
  },
  render: (args) => ({
    components: { IconButton, Search },
    setup: () => ({ args }),
    template: `<IconButton v-bind="args"><Search /></IconButton>`,
  }),
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default. */
export const Default: Story = {};

/** Active (accent tint). */
export const Active: Story = { args: { active: true } };

/** Danger (destructive hover). */
export const Danger: Story = { args: { danger: true } };

/** Armed (destructive confirm pulse). */
export const Armed: Story = { args: { armed: true } };

/** Disabled. */
export const Disabled: Story = { args: { disabled: true } };

/** Mail icon example. */
export const MailIcon: Story = {
  render: (args) => ({
    components: { IconButton, Mail },
    setup: () => ({ args }),
    template: `<IconButton v-bind="args"><Mail /></IconButton>`,
  }),
};

/** Trash icon example. */
export const TrashIcon: Story = {
  render: (args) => ({
    components: { IconButton, Trash2 },
    setup: () => ({ args }),
    template: `<IconButton v-bind="args"><Trash2 /></IconButton>`,
  }),
};
