import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, type Ref } from 'vue';

import { useRightToolbarView } from './use-right-toolbar-view';

/**
 * `useRightToolbarView` composes its dependencies by import; each is mocked
 * with controllable refs so the tests drive the state machine without
 * seeding the real stores.
 */
const state = vi.hoisted(() => ({
  setDockedPlaylistPanelVisible: vi.fn(),
})) as {
  activeConversationId: Ref<string>;
  hasAttachments: Ref<boolean>;
  hasPlaylist: Ref<boolean>;
  hasHistory: Ref<boolean>;
  setDockedPlaylistPanelVisible: ReturnType<typeof vi.fn>;
};

vi.mock('@/composables/use-playback-session', () => ({
  usePlaybackSession: () => ({
    setDockedPlaylistPanelVisible: state.setDockedPlaylistPanelVisible,
  }),
}));

vi.mock('@/components/chat/composables/use-chat-conversation', async () => {
  const { ref } = await import('vue');
  const activeConversationId = ref('conversation-1');
  state.activeConversationId = activeConversationId;
  return {
    useChatConversation: () => ({ conversationId: activeConversationId }),
  };
});

vi.mock('./use-attachment-list', async () => {
  const { ref } = await import('vue');
  const hasAttachments = ref(false);
  state.hasAttachments = hasAttachments;
  return { useAttachmentList: () => ({ hasAttachments }) };
});

vi.mock('../playlist/composables/use-playlist-tab', async () => {
  const { ref } = await import('vue');
  const hasPlaylist = ref(true);
  state.hasPlaylist = hasPlaylist;
  return { usePlaylistTab: () => ({ hasPlaylist }) };
});

vi.mock('../history/composables/use-history-availability', async () => {
  const { ref } = await import('vue');
  const hasHistory = ref(true);
  state.hasHistory = hasHistory;
  return { useHistoryAvailability: () => ({ hasHistory }) };
});

describe('useRightToolbarView', () => {
  let scope: ReturnType<typeof effectScope> | null = null;

  beforeEach(() => {
    state.setDockedPlaylistPanelVisible.mockClear();
  });

  afterEach(() => {
    scope?.stop();
    scope = null;
  });

  function createView(
    initial: {
      activeConversationId?: string;
      hasAttachments?: boolean;
      hasPlaylist?: boolean;
      hasHistory?: boolean;
    } = {},
  ) {
    state.activeConversationId.value =
      initial.activeConversationId ?? 'conversation-1';
    state.hasAttachments.value = initial.hasAttachments ?? false;
    state.hasPlaylist.value = initial.hasPlaylist ?? false;
    state.hasHistory.value = initial.hasHistory ?? false;

    scope = effectScope();
    const view = scope.run(() => useRightToolbarView())!;

    return { ...view };
  }

  it('falls back to an available view on setup when the default is empty', () => {
    const { rightToolbarView } = createView({ hasHistory: true });

    expect(rightToolbarView.value).toBe('history');
  });

  it('selectView switches the view and projects the playlist visibility', () => {
    const { rightToolbarView, selectView } = createView({ hasHistory: true });

    selectView('playlist');
    expect(rightToolbarView.value).toBe('playlist');
    expect(state.setDockedPlaylistPanelVisible).toHaveBeenLastCalledWith(true);

    selectView('history');
    expect(rightToolbarView.value).toBe('history');
    expect(state.setDockedPlaylistPanelVisible).toHaveBeenLastCalledWith(false);
  });

  it('auto-picks another available section before any click', async () => {
    const { rightToolbarView } = createView({
      hasAttachments: true,
      hasHistory: true,
    });

    // Attachments take priority over history at setup.
    expect(rightToolbarView.value).toBe('files');

    state.hasAttachments.value = false;
    await nextTick();

    expect(rightToolbarView.value).toBe('history');
  });

  it('keeps an explicit selection when the section empties', async () => {
    const { rightToolbarView, selectView } = createView({
      hasAttachments: true,
      hasHistory: true,
    });

    expect(rightToolbarView.value).toBe('files');

    selectView('history');
    expect(rightToolbarView.value).toBe('history');

    // History empties after the click — the selection sticks, no bounce.
    state.hasHistory.value = false;
    await nextTick();

    expect(rightToolbarView.value).toBe('history');
  });

  it('keeps an explicit selection through a recovered flicker', async () => {
    const { rightToolbarView, selectView } = createView({
      hasAttachments: true,
      hasHistory: true,
    });

    selectView('history');
    expect(rightToolbarView.value).toBe('history');

    state.hasHistory.value = false;
    await nextTick();
    expect(rightToolbarView.value).toBe('history');

    state.hasHistory.value = true;
    await nextTick();

    expect(rightToolbarView.value).toBe('history');
  });

  it('auto-picks again and clears the explicit selection when the conversation changes', async () => {
    const { rightToolbarView, selectView } = createView({
      hasAttachments: true,
      hasHistory: true,
    });

    selectView('files');
    expect(rightToolbarView.value).toBe('files');

    // A new conversation only has history, so the initial pick re-seats.
    state.hasAttachments.value = false;
    state.activeConversationId.value = 'conversation-2';
    await nextTick();

    expect(rightToolbarView.value).toBe('history');
  });

  it('moves the auto-picked view to the first available section before any click', async () => {
    const { rightToolbarView } = createView();

    // Nothing has content yet; the initial pick falls back to history until
    // the first section appears.
    expect(rightToolbarView.value).toBe('history');

    state.hasAttachments.value = true;
    await nextTick();

    expect(rightToolbarView.value).toBe('files');
  });
});
