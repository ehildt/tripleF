import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import Switch from './Switch.vue';

const meta = {
  title: 'Sysctl/Shared/UI/Switch/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    checked: false,
    disabled: false,
    onToggle: fn(),
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Toggle in the off position. */
export const Off: Story = {};

/** Toggle in the on position. */
export const On: Story = { args: { checked: true } };

/** Toggle that cannot be interacted with. */
export const Disabled: Story = { args: { disabled: true } };

/** Disabled toggle that is visually on. */
export const DisabledOn: Story = { args: { checked: true, disabled: true } };
