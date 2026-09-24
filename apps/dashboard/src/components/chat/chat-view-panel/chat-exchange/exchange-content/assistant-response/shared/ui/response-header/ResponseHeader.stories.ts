import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ResponseHeader from './ResponseHeader.vue';

const meta = {
  title: 'Chat/AssistantResponse/Shared/UI/ResponseHeader',
  component: ResponseHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Title + optional subtitle header block shared by every response surface:
hero panels, stockmarket quote headers, product/shop banners, and the
evaluation subject profile. The trailing default slot carries right-aligned
content. \`panel\` = hero backdrop; \`ruled\` = subject-profile divider.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md', 'xl'] },
    as: { control: 'select', options: ['h2', 'h3'] },
    panel: { control: 'boolean' },
    ruled: { control: 'boolean' },
  },
  args: {
    title: 'Global markets rally on rate-cut hopes',
    subtitle: 'Stocks closed higher across Europe and Asia',
    size: 'md',
    as: 'h2',
    panel: false,
    ruled: false,
  },
} satisfies Meta<typeof ResponseHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Bare quote/shop header. */
export const Default: Story = {};

/** Hero panel with the tertiary backdrop. */
export const HeroPanel: Story = { args: { panel: true } };

/** Product banner scale. */
export const Banner: Story = {
  args: {
    title: 'Sony WH-1000XM5',
    subtitle: 'Premium noise cancelling',
    size: 'xl',
  },
};

/** Subject-profile header with the hairline and a trailing score. */
export const SubjectProfile: Story = {
  args: { title: 'Bose QuietComfort Ultra', as: 'h3', size: 'sm', ruled: true },
  render: (args) => ({
    components: { ResponseHeader },
    setup: () => ({ args }),
    template: `
      <ResponseHeader v-bind="args">
        <span style="font-size:1.1em;font-weight:700;color:var(--color-accent-primary)">8.4</span>
      </ResponseHeader>`,
  }),
};
