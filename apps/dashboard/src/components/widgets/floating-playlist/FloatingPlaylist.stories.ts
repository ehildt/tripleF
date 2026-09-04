import type { Decorator, Meta, StoryObj } from '@storybook/vue3-vite';
import { createPinia, setActivePinia } from 'pinia';

import { closeLaunchedVideo } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
import { useConversationStore } from '@/stores/conversation';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { setActivePlaylist, setPlaylists } from './composables/playlist.state';
import {
  floatingPlaylistOpen,
  playlistMode,
} from './composables/playlist-settings.state';
import FloatingPlaylist from './FloatingPlaylist.vue';

const sampleVideos: VideoGalleryItem[] = [
  {
    videoUrl: 'https://www.youtube.com/watch?v=CCHdMIEGaaM',
    title: 'Daft Punk - Get Lucky (Official Video)',
    channel: 'Daft Punk',
    duration: '4:08',
  },
  {
    videoUrl: 'https://www.youtube.com/watch?v=hTWKbfoikeg',
    title: 'Nirvana - Smells Like Teen Spirit (Official Music Video)',
    channel: 'Nirvana',
    duration: '4:38',
  },
  {
    videoUrl: 'https://www.youtube.com/watch?v=Jm5anlF9wj0',
    title: 'Boards of Canada - Dayvan Cowboy',
    channel: 'Warp Records',
    duration: '5:02',
  },
];

/**
 * Prime the shared state the widget reads (mode, open state, the active
 * conversation's playlists) the way App.vue and the playback surfaces would
 * at runtime, then render the story.
 */
function seedState(options: { open?: boolean; videos?: VideoGalleryItem[] }) {
  const decorator: Decorator = (story) => {
    setActivePinia(createPinia());
    useConversationStore().activeConversationId = 'storybook';
    playlistMode.value = 'floating';
    floatingPlaylistOpen.value = options.open ?? true;
    closeLaunchedVideo();
    const videos = options.videos ?? sampleVideos;
    setPlaylists([
      { name: 'Focus mix', videos, conversationId: 'storybook' },
      {
        name: 'Long ambient',
        videos: sampleVideos,
        conversationId: 'storybook',
      },
    ]);
    setActivePlaylist('Focus mix');
    return { components: { story }, template: '<story />' };
  };
  return decorator;
}

const meta = {
  title: 'Widgets/FloatingPlaylist',
  component: FloatingPlaylist,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
App-level floating playlist window, mounted in App.vue while the playlist
mode is 'floating' (Settings → Widgets → Playlist). Drag by the bar, collapse
to an edge tab, and capture the queue as a named playlist to load later.
`,
      },
    },
  },
  decorators: [seedState({})],
} satisfies Meta<typeof FloatingPlaylist>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Open window with a queue and playlists, anchored middle-right. */
export const Default: Story = {};

/** Collapsed: only the edge tab at the docked side remains. */
export const Collapsed: Story = {
  decorators: [seedState({ open: false })],
};

/** Empty queue: the playlists menu stays reachable for loading. */
export const EmptyQueue: Story = {
  decorators: [seedState({ videos: [] })],
};
