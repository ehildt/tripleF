import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SectionTitle from './SectionTitle.vue';

const meta = {
  title: 'Chat/AssistantResponse/Shared/UI/SectionTitle',
  component: SectionTitle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Section heading for assistant-response blocks (news, sources, …): a
consistent h3 with the shared section-title treatment. Presentational —
the caller owns the text (translated or computed).
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    id: { control: 'text' },
  },
  args: {
    title: 'News & sources',
  },
} satisfies Meta<typeof SectionTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
