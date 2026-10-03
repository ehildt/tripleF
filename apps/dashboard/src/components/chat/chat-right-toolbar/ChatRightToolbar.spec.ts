import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Ref } from 'vue';

import ChatRightToolbar from './ChatRightToolbar.vue';
import type { RightToolbarView } from './right-toolbar-view.type';

const panelMountCounts = vi.hoisted(() => ({
  Files: 0,
  PlaylistPanel: 0,
  History: 0,
}));

/** Slots the hoisted composable mocks fill with the reactive refs they create,
 * so the tests drive tab visibility and the active view without seeding the
 * real stores. */
interface ToolbarState {
  activeView: Ref<RightToolbarView>;
  hasAttachments: Ref<boolean>;
  hasPlaylist: Ref<boolean>;
  hasHistory: Ref<boolean>;
}

const toolbar = vi.hoisted(() => ({})) as ToolbarState;

/**
 * Each panel is replaced by a stub that only counts how often it is set up. A
 * panel that remounts on every tab switch bumps its counter; a panel cached by
 * KeepAlive sets up once for the life of the test.
 */
async function createPanelStub(
  name: keyof typeof panelMountCounts,
  className: string,
) {
  const { defineComponent, h } = await import('vue');
  return {
    default: defineComponent({
      name,
      setup() {
        panelMountCounts[name] += 1;
        return () => h('div', { class: className });
      },
    }),
  };
}

vi.mock('./files/Files.vue', () => createPanelStub('Files', 'files-stub'));
vi.mock('./playlist/PlaylistPanel.vue', () =>
  createPanelStub('PlaylistPanel', 'playlist-stub'),
);
vi.mock('./history/History.vue', () =>
  createPanelStub('History', 'history-stub'),
);

vi.mock('@/composables/use-playback-session', () => ({
  usePlaybackSession: () => ({
    setDockedPlaylistPanelVisible: vi.fn(),
  }),
}));

vi.mock('@/components/chat/composables/use-chat-conversation', async () => {
  const { ref } = await import('vue');
  return {
    useChatConversation: () => ({
      conversationId: ref('conversation-1'),
    }),
  };
});

vi.mock('./files/composables/use-files', async () => {
  const { ref } = await import('vue');
  const hasAttachments = ref(false);
  toolbar.hasAttachments = hasAttachments;
  return {
    useFiles: () => ({
      attachments: ref([]),
      hasAttachments,
      previewUrl: vi.fn(() => ''),
      previewUrlForHash: vi.fn(() => ''),
      removeAttachment: vi.fn(),
      toggleAttachment: vi.fn(),
      removePage: vi.fn(),
    }),
  };
});

vi.mock('./playlist/composables/use-playlist-tab', async () => {
  const { ref } = await import('vue');
  const hasPlaylist = ref(true);
  toolbar.hasPlaylist = hasPlaylist;
  return {
    usePlaylistTab: () => ({ hasPlaylist }),
  };
});

vi.mock('./history/composables/use-history-availability', async () => {
  const { ref } = await import('vue');
  const hasHistory = ref(true);
  toolbar.hasHistory = hasHistory;
  return {
    useHistoryAvailability: () => ({ hasHistory }),
  };
});

vi.mock('./composables/use-right-toolbar-view', async () => {
  const { ref } = await import('vue');
  const activeView = ref<RightToolbarView>('history');
  const selectView = vi.fn((view: RightToolbarView) => {
    activeView.value = view;
  });
  toolbar.activeView = activeView;
  return {
    useRightToolbarView: () => ({ rightToolbarView: activeView, selectView }),
  };
});

describe('ChatRightToolbar', () => {
  beforeEach(() => {
    panelMountCounts.Files = 0;
    panelMountCounts.PlaylistPanel = 0;
    panelMountCounts.History = 0;
    toolbar.activeView.value = 'history';
    toolbar.hasAttachments.value = false;
    toolbar.hasPlaylist.value = true;
    toolbar.hasHistory.value = true;
  });

  function mountToolbar() {
    return mount(ChatRightToolbar);
  }

  function findTab(wrapper: VueWrapper, label: string) {
    const tab = wrapper.findAll('.tab').find((item) => item.text() === label);
    if (!tab) throw new Error(`Tab "${label}" not found`);
    return tab;
  }

  it('keeps a panel mounted when switching away and back', async () => {
    const wrapper = mountToolbar();
    await flushPromises();

    expect(wrapper.find('.history-stub').exists()).toBe(true);
    expect(panelMountCounts.History).toBe(1);

    await findTab(wrapper, 'Playlist').find('button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.playlist-stub').exists()).toBe(true);
    expect(wrapper.find('.history-stub').exists()).toBe(false);
    expect(panelMountCounts.PlaylistPanel).toBe(1);

    await findTab(wrapper, 'History').find('button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.history-stub').exists()).toBe(true);
    // KeepAlive must reuse the cached instance, not rebuild the panel.
    expect(panelMountCounts.History).toBe(1);
  });

  it('renders only the tabs whose section has content', async () => {
    toolbar.hasPlaylist.value = false;
    toolbar.hasHistory.value = true;

    const wrapper = mountToolbar();
    await flushPromises();

    expect(wrapper.findAll('.tab').map((tab) => tab.text())).toEqual([
      'History',
    ]);
    expect(wrapper.find('.tab').classes()).toContain('tab--active');
  });

  it('switches the active view when a tab is clicked', async () => {
    const wrapper = mountToolbar();
    await flushPromises();

    await findTab(wrapper, 'Playlist').find('button').trigger('click');
    await flushPromises();

    expect(toolbar.activeView.value).toBe('playlist');
    expect(wrapper.find('.playlist-stub').exists()).toBe(true);
  });
});
