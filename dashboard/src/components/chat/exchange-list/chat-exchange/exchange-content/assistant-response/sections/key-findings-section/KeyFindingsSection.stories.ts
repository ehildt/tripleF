import type { Meta, StoryObj } from '@storybook/vue3-vite';

import KeyFindingsSection from './KeyFindingsSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/KeyFindingsSection',
  component: KeyFindingsSection,
  tags: ['autodocs'],
  argTypes: {
    items: { control: 'object' },
    title: { control: 'text' },
  },
  args: {
    items: [{ text: 'First observation' }, { text: 'Second observation' }],
    title: 'Key findings',
  },
} satisfies Meta<typeof KeyFindingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Embedded use (stockmarket grid): no heading, tags only. */
export const NoTitle: Story = {
  args: { title: undefined },
};

export const Empty: Story = {
  args: { items: [] },
};

/** Ten entries so the color cycle visibly wraps back to the start. */
export const ManyFindings: Story = {
  args: {
    items: Array.from({ length: 10 }, (_, index) => ({
      text: `Finding ${index + 1}`,
    })),
  },
};
