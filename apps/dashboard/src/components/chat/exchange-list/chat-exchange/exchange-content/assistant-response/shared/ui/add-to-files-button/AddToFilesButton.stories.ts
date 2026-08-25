import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import AddToFilesButton from './AddToFilesButton.vue';

const meta = {
  title: 'Chat/AssistantResponse/Shared/UI/AddToFilesButton',
  component: AddToFilesButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Add-to-files button for image surfaces (gallery tiles, grid tiles, lightbox
header). Clicking registers the image as a conversation file via
\`useAddImageToFiles\` so the next prompt can reference it.
`,
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'lg'] },
  },
  args: {
    onAdd: fn(),
  },
} satisfies Meta<typeof AddToFilesButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default card scale. */
export const Default: Story = {};

/** Compact bar scale for dense chrome. */
export const Compact: Story = { args: { size: 'sm' } };
