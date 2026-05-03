import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import SwitchCard from './SwitchCard.vue';

const meta = {
  title: 'Sysctl/Shared/UI/SwitchCard/SwitchCard',
  component: SwitchCard,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    hasResults: { control: 'boolean' },
    results: { control: 'number' },
    maxResults: { control: 'number' },
  },
  args: {
    label: 'web',
    description: 'General web search results',
    checked: true,
    disabled: false,
    hasResults: true,
    results: 10,
    maxResults: 200,
    onToggle: fn(),
    onUpdateResults: fn(),
  },
} satisfies Meta<typeof SwitchCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Active endpoint card with a results input. */
export const Active: Story = {};

/** Unchecked endpoint card. */
export const Inactive: Story = { args: { checked: false } };

/** Disabled card with dimmed controls. */
export const Disabled: Story = { args: { disabled: true } };

/** Card without the results input. */
export const WithoutResults: Story = { args: { hasResults: false } };
