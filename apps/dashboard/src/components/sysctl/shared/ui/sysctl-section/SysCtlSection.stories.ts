import type { Meta, StoryObj } from '@storybook/vue3-vite';

import PanelLayout from '@/components/shared/ui/panel-layout/PanelLayout.vue';

import SysCtlSection from './SysCtlSection.vue';

const meta = {
  title: 'Sysctl/Shared/UI/SysCtlSection/SysCtlSection',
  component: SysCtlSection,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    error: { control: 'boolean' },
    loadingMessage: { control: 'text' },
    errorMessage: { control: 'text' },
  },
  args: {
    loading: false,
    error: false,
    loadingMessage: 'Loading…',
    errorMessage: 'Failed to load config.',
  },
} satisfies Meta<typeof SysCtlSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default: panels laid out in a flex column with a 1-unit gap. */
export const Default: Story = {
  render: () => ({
    components: { SysCtlSection, PanelLayout },
    template: `
      <SysCtlSection>
        <PanelLayout>Panel one</PanelLayout>
        <PanelLayout>Panel two</PanelLayout>
      </SysCtlSection>
    `,
  }),
};

/** Loading hides the panels and shows the loading state. */
export const Loading: Story = {
  args: { loading: true },
  render: (args) => ({
    components: { SysCtlSection, PanelLayout },
    setup: () => ({ args }),
    template: `
      <SysCtlSection v-bind="args">
        <PanelLayout>Panel one</PanelLayout>
      </SysCtlSection>
    `,
  }),
};

/** Error hides the panels and shows the error state. */
export const ErrorState: Story = {
  args: { error: true },
  render: (args) => ({
    components: { SysCtlSection, PanelLayout },
    setup: () => ({ args }),
    template: `
      <SysCtlSection v-bind="args">
        <PanelLayout>Panel one</PanelLayout>
      </SysCtlSection>
    `,
  }),
};
