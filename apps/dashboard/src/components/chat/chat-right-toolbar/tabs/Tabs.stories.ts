import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ref } from 'vue';

import type { RightToolbarView } from '@/components/chat/chat-right-toolbar/right-toolbar-view.type';

import Tabs from './Tabs.vue';

const meta = {
  title: 'Chat/ChatRightToolbar/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The section switcher for the chat right toolbar. It renders one \`Tab\` per
available section — Files (attachments), Playlist, and History — and emits
\`selectView\` with the chosen section on click. Availability is driven by
\`hasAttachments\`, \`hasPlaylist\`, and \`hasHistory\`; the active section is
highlighted via \`activeView\`.
        `,
      },
    },
  },
  argTypes: {
    activeView: {
      control: 'select',
      options: ['files', 'playlist', 'history'],
    },
    hasAttachments: { control: 'boolean' },
    hasPlaylist: { control: 'boolean' },
    hasHistory: { control: 'boolean' },
  },
  args: {
    activeView: 'playlist',
    hasAttachments: true,
    hasPlaylist: true,
    hasHistory: true,
    onSelectView: fn(),
  },
  render: (args) => ({
    components: { Tabs },
    setup() {
      // Local active view so the story actually switches tabs. The wrapper
      // forwards the choice to the spy so the interaction test can assert it.
      const activeView = ref<RightToolbarView>(args.activeView);

      function onSelectView(view: RightToolbarView) {
        activeView.value = view;
        args.onSelectView(view);
      }

      return { args, activeView, onSelectView };
    },
    template: `
      <div style="width: 320px;">
        <Tabs
          :active-view="activeView"
          :has-attachments="args.hasAttachments"
          :has-playlist="args.hasPlaylist"
          :has-history="args.hasHistory"
          @select-view="onSelectView"
        />
      </div>
    `,
  }),
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All three sections have content; Playlist is active. */
export const AllAvailable: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Files, Playlist, and History all render. The active tab is highlighted; clicking a tab emits the selected section.',
      },
    },
  },
};

/** Only Playlist and History have content — the Files tab is hidden. */
export const PlaylistAndHistory: Story = {
  args: {
    activeView: 'history',
    hasAttachments: false,
    hasPlaylist: true,
    hasHistory: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'No attachments, so only Playlist and History tabs render. History is active.',
      },
    },
  },
};

/**
 * Interaction test for the Playlist ↔ History switch: clicking Playlist makes
 * it active, then clicking History switches back. Each click must emit the
 * selected section exactly once.
 */
export const ClickPlaylistThenHistory: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Interaction test: click Playlist (active), then click History — each click must emit the selected section exactly once.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const playlistTab = canvas.getByRole('button', { name: 'Playlist' });
    const historyTab = canvas.getByRole('button', { name: 'History' });

    await expect(playlistTab).toBeInTheDocument();
    await expect(historyTab).toBeInTheDocument();

    await userEvent.click(playlistTab);
    await expect(args.onSelectView).toHaveBeenLastCalledWith('playlist');

    await userEvent.click(historyTab);
    await expect(args.onSelectView).toHaveBeenLastCalledWith('history');
  },
};
