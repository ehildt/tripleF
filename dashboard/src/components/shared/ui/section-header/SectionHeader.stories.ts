import { HeartPulse } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SectionHeader from './SectionHeader.vue';

const meta = {
  title: 'Shared/UI/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Shared section header for the sysctl and preprocessing panels: a small
lucide icon + uppercase mono title.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
  },
  args: {
    icon: HeartPulse,
    title: 'System health',
  },
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default section header. */
export const Default: Story = {};
