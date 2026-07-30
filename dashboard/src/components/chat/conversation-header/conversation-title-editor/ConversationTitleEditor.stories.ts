import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ConversationTitleEditor from './ConversationTitleEditor.vue';

const meta = {
  title: 'Chat/SessionHeader/ConversationTitleEditor',
  component: ConversationTitleEditor,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Inline input for renaming a conversation. Binds to modelValue and emits
update:modelValue, keydown, and blur.
`,
      },
    },
  },
  argTypes: {
    modelValue: { control: 'text' },
  },
  args: {
    modelValue: 'New title',
  },
} satisfies Meta<typeof ConversationTitleEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default editor state. */
export const Default: Story = {};
