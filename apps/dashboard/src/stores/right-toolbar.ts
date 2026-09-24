import { defineStore } from 'pinia';
import { computed, nextTick, type Ref, ref, watch } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { deleteUploadedObject } from '@/api/storage.api';
import { useAttachmentList } from '@/components/chat/chat-right-toolbar/composables/use-attachment-list';
import type { AttachmentItem } from '@/components/chat/chat-right-toolbar/composables/use-attachment-list.types';
import type { RightToolbarView } from '@/components/chat/chat-right-toolbar/right-toolbar-view.type';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { useAttachedFilesStore } from '@/stores/attached-files';
import { useConversationStore } from '@/stores/conversation';
import { conversationHasVideos } from '@/stores/helpers/conversation/conversation-has-videos.helper';
import { usePlaylistStore } from '@/stores/playlist';
import { usePlaylistSettingsStore } from '@/stores/playlist-settings';
import { useVideoPlaybackStore } from '@/stores/video-playback';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

/**
 * View-model store for the chat right toolbar: which section (files,
 * playlist, or history) is active, the automatic switches that follow
 * conversation changes and per-section content counts, the merged Files
 * attachment list with its actions, and the now-playing marquee signal
 * shared with the floating popouts.
 *
 * This replaces the previous useRightToolbarView composable plus the
 * module-level right-toolbar-view state singleton: the store is the single
 * source of truth for both the docked toolbar and the deep surfaces that
 * mirror it.
 */
export const useRightToolbarStore = defineStore('rightToolbar', () => {
  const conversationStore = useConversationStore();
  const attachedFilesStore = useAttachedFilesStore();
  const toast = useToast();
  const videoPlaybackStore = useVideoPlaybackStore();
  const playlistStore = usePlaylistStore();
  const playlistSettingsStore = usePlaylistSettingsStore();

  // ── Active conversation ──────────────────────────────────
  const activeConversationId = computed(
    () => conversationStore.activeConversationId ?? '',
  );
  const activeConversation = computed(
    () => conversationStore.getConversation(activeConversationId.value) ?? null,
  );

  /** The stable server conversationId (mapped from the internal id). */
  const conversationId = computed(() => {
    const conversation = activeConversation.value;
    if (!conversation?.id) return '';
    return conversationStore.getConversationId(conversation.id);
  });

  // ── Files: merged attachment list ───────────────────────
  const attachedFiles = computed(() => attachedFilesStore.attachedFiles);
  const uploadedImages = computed(() => {
    const conversation = activeConversation.value;
    if (!conversation?.id || !conversationId.value) return [];
    return conversationStore.getUploadedImagesForConversation(
      conversation.id,
      conversationId.value,
    );
  });
  const uploadedDocuments = computed(() => {
    const conversation = activeConversation.value;
    if (!conversation?.id || !conversationId.value) return [];
    return conversationStore.getUploadedDocumentsForConversation(
      conversation.id,
      conversationId.value,
    );
  });

  const { attachments, hasAttachments } = useAttachmentList({
    attachedFiles,
    uploadedImages,
    uploadedDocuments,
  });

  // ── Playlist ────────────────────────────────────────────
  const playlistVideos = computed<VideoGalleryItem[]>(() =>
    playlistStore.getActivePlaylistVideos(),
  );

  /** The playlist tab drops entirely in floating mode. */
  const panelPlaylistVideos = computed<VideoGalleryItem[]>(() =>
    playlistSettingsStore.playlistMode === 'floating'
      ? []
      : playlistVideos.value,
  );

  const hasPlaylist = computed(
    () =>
      panelPlaylistVideos.value.length > 0 ||
      playlistStore.getPlaylists().length > 0 ||
      (videoPlaybackStore.launchedFromPlaylist &&
        Boolean(videoPlaybackStore.launchedVideo)) ||
      (playlistSettingsStore.playlistMode !== 'floating' &&
        conversationHasVideos(activeConversation.value)),
  );

  // ── History ─────────────────────────────────────────────
  const userExchanges = computed(
    () =>
      activeConversation.value?.exchanges.filter((ex) => ex.role === 'user') ??
      [],
  );
  const hasHistory = computed(() => userExchanges.value.length > 0);

  // ── Section view + automatic switches ────────────────────
  const rightToolbarView = ref<RightToolbarView>('files');

  /** Pick the highest-priority view that currently has content. */
  function firstAvailableView(): RightToolbarView {
    if (hasAttachments.value) return 'files';
    if (hasPlaylist.value) return 'playlist';
    return 'history';
  }

  function isViewAvailable(view: RightToolbarView): boolean {
    if (view === 'files') return hasAttachments.value;
    if (view === 'playlist') return hasPlaylist.value;
    return hasHistory.value;
  }

  // Switching conversations lands on the new conversation's history so its
  // messages are immediately visible. A conversation without history falls
  // through to the next available tab.
  watch(
    () => conversationStore.activeConversationId,
    async () => {
      await nextTick();
      rightToolbarView.value = hasHistory.value
        ? 'history'
        : firstAvailableView();
    },
    { immediate: true },
  );

  watch([hasAttachments, hasHistory, hasPlaylist], () => {
    if (!isViewAvailable(rightToolbarView.value)) {
      rightToolbarView.value = firstAvailableView();
    }
  });

  /**
   * Follow a change in one tab's content count into that tab. Count changes
   * that flush in the same tick as a conversation switch are the new
   * conversation's data loading, not user actions — those are skipped.
   */
  let conversationSwitchTick = false;
  watch(
    () => conversationStore.activeConversationId,
    async () => {
      conversationSwitchTick = true;
      await nextTick();
      conversationSwitchTick = false;
    },
  );

  const playlistVideoCount = computed(() => panelPlaylistVideos.value.length);
  const attachmentCount = computed(() => attachments.value.length);
  const historyItemCount = computed(() => userExchanges.value.length);

  function watchCountIntoView(count: Ref<number>, view: RightToolbarView) {
    watch(count, (value, previous) => {
      if (conversationSwitchTick) return;
      // A removal that empties a tab must not navigate INTO it — the
      // availability fallback picks the next available tab instead.
      if (!isViewAvailable(view)) return;
      if (value !== (previous ?? 0)) rightToolbarView.value = view;
    });
  }

  watchCountIntoView(playlistVideoCount, 'playlist');
  watchCountIntoView(attachmentCount, 'files');
  watchCountIntoView(historyItemCount, 'history');

  function selectView(view: RightToolbarView) {
    rightToolbarView.value = view;
  }

  // ── Visibility ──────────────────────────────────────────
  const shouldShow = computed(
    () =>
      activeConversation.value !== null &&
      (hasAttachments.value || hasPlaylist.value || hasHistory.value),
  );

  // ── Now-playing marquee (mirrored for floating popouts) ─
  const playlistMarqueeVisible = computed(() => {
    if (rightToolbarView.value !== 'playlist') {
      if (
        playlistSettingsStore.playlistMode !== 'floating' ||
        !playlistSettingsStore.floatingPlaylistOpen
      ) {
        return false;
      }
    }
    const url = videoPlaybackStore.activePlaybackVideoUrl;
    if (!url) return false;
    return playlistStore.isVideoInActivePlaylist(url);
  });

  // ── Attachment preview URLs ─────────────────────────────
  function previewUrlForHash(hash: string): string {
    const conversation = activeConversation.value;
    if (!conversation?.id) return '';
    return getApiUrl(
      `/api/v1/storage/${conversation.id}/${conversation.conversationId}/${hash}`,
    );
  }

  function previewUrl(item: AttachmentItem): string {
    if (!item.isUploaded) return item.previewUrl;
    return previewUrlForHash(item.hash);
  }

  // ── Attachment actions ──────────────────────────────────
  function findPendingIndex(hash: string): number {
    return attachedFiles.value.findIndex((entry) => entry.hash === hash);
  }

  /** Delete a local image object unless another conversation still references it. */
  async function deleteImageObject(hash: string): Promise<boolean> {
    const stillReferenced = conversationStore.hasUploadedImageReference(
      activeConversationId.value,
      hash,
      conversationId.value,
    );
    if (stillReferenced) return true;
    try {
      await deleteUploadedObject(
        activeConversationId.value,
        conversationId.value,
        hash,
      );
      return true;
    } catch (e) {
      toast.debug(e instanceof Error ? e.message : String(e));
      toast.error(i18n.global.t('toast.failedRemoveFile'));
      return false;
    }
  }

  function pagesOf(parentHash: string) {
    return conversationStore
      .getUploadedImagesForConversation(
        activeConversationId.value,
        conversationId.value,
      )
      .filter((img) => img.parentHash === parentHash);
  }

  /** Remove the pdf original: the pending entry pre-submit, the uploaded document after. */
  function removeOriginal(parentHash: string) {
    const pendingIndex = findPendingIndex(parentHash);
    if (pendingIndex !== -1) {
      attachedFilesStore.removeAttachedFile(pendingIndex);
      return;
    }
    conversationStore.removeUploadedDocument(
      activeConversationId.value,
      parentHash,
      conversationId.value,
    );
  }

  async function removeGallery(parentHash: string) {
    const pages = pagesOf(parentHash);
    for (const page of pages) {
      if (page.source !== 'cloud') {
        const ok = await deleteImageObject(page.hash);
        if (!ok) return;
      }
    }
    conversationStore.removeUploadedImagesForParent(
      activeConversationId.value,
      parentHash,
      conversationId.value,
    );
    removeOriginal(parentHash);
  }

  function toggleGallery(parentHash: string) {
    const pages = pagesOf(parentHash);
    if (pages.length === 0) return;
    const allSelected = pages.every((p) => p.selected !== false);
    conversationStore.setUploadedImagesSelectedForParent(
      activeConversationId.value,
      parentHash,
      !allSelected,
      conversationId.value,
    );
    const pendingIndex = findPendingIndex(parentHash);
    if (pendingIndex !== -1) {
      attachedFilesStore.toggleAttachedFile(pendingIndex);
      return;
    }
    conversationStore.toggleUploadedDocumentSelected(
      activeConversationId.value,
      parentHash,
      conversationId.value,
    );
  }

  async function removeAttachment(id: string) {
    const item = attachments.value.find((a) => a.id === id);
    if (!item) return;

    if (item.pendingIndex !== null) {
      attachedFilesStore.removeAttachedFile(item.pendingIndex);
      return;
    }
    if (!activeConversation.value) return;

    if (item.kind === 'gallery') {
      await removeGallery(item.hash);
      return;
    }
    if (item.kind === 'document') {
      conversationStore.removeUploadedDocument(
        activeConversationId.value,
        item.hash,
        conversationId.value,
      );
      return;
    }
    if (item.source !== 'cloud') {
      const ok = await deleteImageObject(item.hash);
      if (!ok) return;
    }
    conversationStore.removeUploadedImage(
      activeConversationId.value,
      item.hash,
      conversationId.value,
    );
  }

  function toggleAttachment(id: string) {
    const item = attachments.value.find((a) => a.id === id);
    if (!item) return;

    if (item.pendingIndex !== null) {
      attachedFilesStore.toggleAttachedFile(item.pendingIndex);
      return;
    }
    if (!activeConversation.value) return;

    if (item.kind === 'gallery') {
      toggleGallery(item.hash);
      return;
    }
    if (item.kind === 'document') {
      conversationStore.toggleUploadedDocumentSelected(
        activeConversationId.value,
        item.hash,
        conversationId.value,
      );
      return;
    }
    conversationStore.toggleUploadedImageSelected(
      activeConversationId.value,
      item.hash,
      conversationId.value,
    );
  }

  /** Drop one page of a pdf; dropping the last page removes the whole pdf. */
  async function removePage(parentHash: string, pageHash: string) {
    if (!activeConversation.value) return;
    const page = pagesOf(parentHash).find((img) => img.hash === pageHash);
    if (!page) return;

    if (page.source !== 'cloud') {
      const ok = await deleteImageObject(pageHash);
      if (!ok) return;
    }
    conversationStore.removeUploadedImage(
      activeConversationId.value,
      pageHash,
      conversationId.value,
    );
    if (pagesOf(parentHash).length === 0) removeOriginal(parentHash);
  }

  return {
    activeConversationId,
    activeConversation,
    rightToolbarView,
    selectView,
    shouldShow,
    attachments,
    hasAttachments,
    hasPlaylist,
    hasHistory,
    playlistVideos,
    playlistMarqueeVisible,
    previewUrl,
    previewUrlForHash,
    removeAttachment,
    toggleAttachment,
    removePage,
  };
});
