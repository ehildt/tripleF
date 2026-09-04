import type { Meta, StoryObj } from '@storybook/vue3-vite';

import PanelLayout from '@/components/shared/ui/panel-layout/PanelLayout.vue';

import SettingsSection from './SettingsSection.vue';

const meta = {
  title: 'Settings/Shared/UI/SettingsSection/SettingsSection',
  component: SettingsSection,
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
} satisfies Meta<typeof SettingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default: panels laid out in a flex column with a 1-unit gap. */
export const Default: Story = {
  render: () => ({
    components: { SettingsSection, PanelLayout },
    template: `
      <SettingsSection>
        <PanelLayout>Panel one</PanelLayout>
        <PanelLayout>Panel two</PanelLayout>
      </SettingsSection>
    `,
  }),
};

/** Loading hides the panels and shows the loading state. */
export const Loading: Story = {
  args: { loading: true },
  render: (args) => ({
    components: { SettingsSection, PanelLayout },
    setup: () => ({ args }),
    template: `
      <SettingsSection v-bind="args">
        <PanelLayout>Panel one</PanelLayout>
      </SettingsSection>
    `,
  }),
};

/** Error hides the panels and shows the error state. */
export const ErrorState: Story = {
  args: { error: true },
  render: (args) => ({
    components: { SettingsSection, PanelLayout },
    setup: () => ({ args }),
    template: `
      <SettingsSection v-bind="args">
        <PanelLayout>Panel one</PanelLayout>
      </SettingsSection>
    `,
  }),
};
