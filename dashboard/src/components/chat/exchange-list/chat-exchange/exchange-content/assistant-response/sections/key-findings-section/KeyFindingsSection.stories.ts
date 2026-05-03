import type { Meta, StoryObj } from '@storybook/vue3-vite';

import KeyFindingsSection from './KeyFindingsSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/KeyFindingsSection',
  component: KeyFindingsSection,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    items: { control: 'object' },
  },
  args: {
    title: 'Key Observations',
    items: [{ text: 'First observation' }, { text: 'Second observation' }],
  },
} satisfies Meta<typeof KeyFindingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { items: [] },
};
