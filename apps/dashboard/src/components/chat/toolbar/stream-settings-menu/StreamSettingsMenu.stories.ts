import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import StreamSettingsMenu from './StreamSettingsMenu.vue';

function renderStory() {
  return (args: any) => ({
    components: { StreamSettingsMenu },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; justify-content: flex-end; padding: 16px;">
        <StreamSettingsMenu
          :is-open="args.isOpen"
          :is-disabled="args.isDisabled"
          :is-stream-enabled="args.isStreamEnabled"
          :new-event="args.newEvent"
          :new-room-id="args.newRoomId"
          @toggle-menu="args.onToggleMenu"
          @update:is-stream-enabled="args['onUpdate:isStreamEnabled']"
          @update:new-event="args['onUpdate:newEvent']"
          @update:new-room-id="args['onUpdate:newRoomId']"
          @subscribe-to-event="args.onSubscribeToEvent"
        />
      </div>
    `,
  });
}

const meta = {
  title: 'Chat/Toolbar/StreamSettingsMenu/StreamSettingsMenu',
  component: StreamSettingsMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Dropdown for configuring stream mode (word-by-word vs full-text) and
subscribing to new socket events. Shows a Network icon button that opens
the settings panel.
`,
      },
    },
  },
  argTypes: {
    isOpen: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isStreamEnabled: { control: 'boolean' },
    newEvent: { control: 'text' },
    newRoomId: { control: 'text' },
  },
  args: {
    isOpen: false,
    isDisabled: false,
    isStreamEnabled: true,
    newEvent: '',
    newRoomId: '',
    onToggleMenu: fn(),
    'onUpdate:isStreamEnabled': fn(),
    'onUpdate:newEvent': fn(),
    'onUpdate:newRoomId': fn(),
    onSubscribeToEvent: fn(),
  },
  render: renderStory(),
} satisfies Meta<typeof StreamSettingsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed — just the icon button and label. */
export const Closed: Story = {};

/** Open — showing the stream settings dropdown. */
export const Open: Story = { args: { isOpen: true } };

/** Disabled — no model selected. */
export const Disabled: Story = { args: { isDisabled: true } };

/** Text streaming mode. */
export const TextMode: Story = {
  args: { isOpen: true, isStreamEnabled: false },
};
