import type { Meta, StoryObj } from '@storybook/vue3-vite';

import PanelTitleBar from './PanelTitleBar.vue';

const meta = {
  title: 'Shared/UI/PanelTitleBar/PanelTitleBar',
  component: PanelTitleBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Header bar for panels. Displays a chevron icon, title, optional count,
and an actions slot.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    count: { control: 'number' },
  },
  args: {
    title: 'Requests',
    count: 0,
  },
} satisfies Meta<typeof PanelTitleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Title only. */
export const TitleOnly: Story = {};

/** Title with a count badge. */
export const WithCount: Story = { args: { count: 7 } };

/** Title with actions slot. */
export const WithActions: Story = {
  render: (args) => ({
    components: { PanelTitleBar },
    setup() {
      return { args };
    },
    template: `
      <PanelTitleBar v-bind="args">
        <template #actions>
          <button type="button">Clear</button>
        </template>
      </PanelTitleBar>
    `,
  }),
};
