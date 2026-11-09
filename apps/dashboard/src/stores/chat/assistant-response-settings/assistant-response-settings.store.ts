import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import type {
  CollapsedSections,
  CollapsibleSectionKey,
  MediaPresentation,
  MediaPresentations,
  MediaPriority,
} from '../../../types/assistant-response-data.model';
import { parseCollapsedSections } from './helpers/parse-collapsed-sections.helper';
import { parseConversationMediaPriorities } from './helpers/parse-conversation-media-priorities.helper';
import { parseMediaPresentations } from './helpers/parse-media-presentations.helper';
import { parseMediaPriority } from './helpers/parse-media-priority.helper';
import {
  COLLAPSED_SECTIONS_KEY,
  CONVERSATION_MEDIA_PRIORITY_KEY,
  DEFAULT_COLLAPSED_SECTIONS,
  DEFAULT_MEDIA_PRESENTATIONS,
  MEDIA_PRESENTATIONS_KEY,
  MEDIA_PRIORITY_KEY,
} from './assistant-response-settings.constant';

export const useAssistantResponseSettingsStore = defineStore(
  'assistant-response-settings',
  () => {
    /** Global default every conversation inherits unless overridden. */
    const defaultMediaPriority = ref<MediaPriority>('images');
    try {
      defaultMediaPriority.value = parseMediaPriority(
        localStorage.getItem(MEDIA_PRIORITY_KEY),
      );
    } catch {
      /* Storage unavailable: retain the images default. */
    }

    /** Per-conversation overrides keyed by conversation id. */
    const conversationMediaPriorities = ref<Record<string, MediaPriority>>({});
    try {
      conversationMediaPriorities.value = parseConversationMediaPriorities(
        localStorage.getItem(CONVERSATION_MEDIA_PRIORITY_KEY),
      );
    } catch {
      /* Storage unavailable: retain no overrides. */
    }

    /** Whether each response section type is collapsed. */
    const collapsedSections = ref<CollapsedSections>({
      ...DEFAULT_COLLAPSED_SECTIONS,
    });
    try {
      collapsedSections.value = parseCollapsedSections(
        localStorage.getItem(COLLAPSED_SECTIONS_KEY),
      );
    } catch {
      /* Storage unavailable: retain the collapse defaults. */
    }

    /** Which presentation each media section renders in. */
    const mediaPresentations = ref<MediaPresentations>({
      ...DEFAULT_MEDIA_PRESENTATIONS,
    });
    try {
      mediaPresentations.value = parseMediaPresentations(
        localStorage.getItem(MEDIA_PRESENTATIONS_KEY),
      );
    } catch {
      /* Storage unavailable: retain the presentation defaults. */
    }

    watch(defaultMediaPriority, (value) => {
      try {
        localStorage.setItem(MEDIA_PRIORITY_KEY, value);
      } catch {
        /* Storage unavailable: retain the preference in memory. */
      }
    });
    watch(
      conversationMediaPriorities,
      (value) => {
        try {
          localStorage.setItem(
            CONVERSATION_MEDIA_PRIORITY_KEY,
            JSON.stringify(value),
          );
        } catch {
          /* Storage unavailable: retain overrides in memory. */
        }
      },
      { deep: true },
    );
    watch(
      collapsedSections,
      (value) => {
        try {
          localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(value));
        } catch {
          /* Storage unavailable: retain collapse preferences in memory. */
        }
      },
      { deep: true },
    );
    watch(
      mediaPresentations,
      (value) => {
        try {
          localStorage.setItem(MEDIA_PRESENTATIONS_KEY, JSON.stringify(value));
        } catch {
          /* Storage unavailable: retain presentations in memory. */
        }
      },
      { deep: true },
    );

    function setDefaultMediaPriority(priority: MediaPriority): void {
      defaultMediaPriority.value = priority;
    }

    function getConversationMediaPriority(
      conversationId: string,
    ): MediaPriority {
      return (
        conversationMediaPriorities.value[conversationId] ??
        defaultMediaPriority.value
      );
    }

    function setConversationMediaPriority(
      conversationId: string,
      priority: MediaPriority,
    ): void {
      conversationMediaPriorities.value[conversationId] = priority;
    }

    function setSectionCollapsed(
      section: CollapsibleSectionKey,
      collapsed: boolean,
    ): void {
      collapsedSections.value[section] = collapsed;
    }

    function toggleSectionCollapsed(section: CollapsibleSectionKey): void {
      collapsedSections.value[section] = !collapsedSections.value[section];
    }

    function setMediaPresentation(
      media: 'image' | 'video',
      presentation: MediaPresentation,
    ): void {
      mediaPresentations.value[media] = presentation;
    }

    function toggleMediaPresentation(media: 'image' | 'video'): void {
      mediaPresentations.value[media] =
        mediaPresentations.value[media] === 'gallery' ? 'list' : 'gallery';
    }

    return {
      defaultMediaPriority,
      conversationMediaPriorities,
      collapsedSections,
      mediaPresentations,
      setDefaultMediaPriority,
      getConversationMediaPriority,
      setConversationMediaPriority,
      setSectionCollapsed,
      toggleSectionCollapsed,
      setMediaPresentation,
      toggleMediaPresentation,
    };
  },
);
