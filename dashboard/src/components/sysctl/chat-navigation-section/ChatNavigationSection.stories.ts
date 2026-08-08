import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ChatNavigationSection from './ChatNavigationSection.vue';

const meta = {
  title: 'Sysctl/ChatNavigationSection',
  component: ChatNavigationSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The SysCtl "Chat navigation" tab: the global default scroll mode that every
conversation inherits unless overridden per conversation from the conversation
header. Other chat-related settings can live here too.
`,
      },
    },
  },
} satisfies Meta<typeof ChatNavigationSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default live panel. */
export const Default: Story = {};
