import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SourcesSection from './SourcesSection.vue';

const meta = {
  title: 'Chat/AssistantResponse/Sections/SourcesSection',
  component: SourcesSection,
  tags: ['autodocs'],
  argTypes: {
    items: { control: 'object' },
  },
  args: {
    items: [
      { title: 'Example', url: 'https://example.com' },
      { title: 'No URL source' },
      { url: 'https://untitled.example.com' },
    ],
  },
} satisfies Meta<typeof SourcesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { items: [] },
};

/** Ten entries so the color cycle visibly wraps back to the start. */
export const ManySources: Story = {
  args: {
    items: Array.from({ length: 10 }, (_, index) => ({
      title: `Source ${index + 1}`,
      url: `https://example.com/${index + 1}`,
    })),
  },
};
