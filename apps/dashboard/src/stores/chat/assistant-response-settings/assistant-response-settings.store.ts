import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import type {
  CollapsedSections,
  CollapsibleSectionKey,
  MediaPresentation,
  MediaPresentations,
  MediaPriority,
} from '../../../types/assistant-response-data.model';
import {
  COLLAPSED_SECTIONS_KEY,
  CONVERSATION_MEDIA_PRIORITY_KEY,
  DEFAULT_COLLAPSED_SECTIONS,
  DEFAULT_MEDIA_PRESENTATIONS,
  MEDIA_PRESENTATIONS_KEY,
  MEDIA_PRIORITY_KEY,
} from './assistant-response-settings.constant';

function loadMediaPriority(): MediaPriority {
  try {
    const saved = localStorage.getItem(MEDIA_PRIORITY_KEY);
    return saved === 'videos' ? 'videos' : 'images';
  } catch {
    return 'images';
  }
}

function saveMediaPriority(value: MediaPriority): void {
  try {
    localStorage.setItem(MEDIA_PRIORITY_KEY, value);
  } catch {
    /* ignore */
  }
}

function loadConversationMediaPriorities(): Record<string, MediaPriority> {
  try {
    return JSON.parse(
      localStorage.getItem(CONVERSATION_MEDIA_PRIORITY_KEY) || '{}',
    );
  } catch {
    return {};
  }
}

function saveConversationMediaPriorities(
  value: Record<string, MediaPriority>,
): void {
  try {
    localStorage.setItem(
      CONVERSATION_MEDIA_PRIORITY_KEY,
      JSON.stringify(value),
    );
  } catch {
    /* ignore */
  }
}

function loadCollapsedSections(): CollapsedSections {
  try {
    const saved = JSON.parse(
      localStorage.getItem(COLLAPSED_SECTIONS_KEY) || '{}',
    );
    return { ...DEFAULT_COLLAPSED_SECTIONS, ...saved };
  } catch {
    return { ...DEFAULT_COLLAPSED_SECTIONS };
  }
}

function saveCollapsedSections(value: CollapsedSections): void {
  try {
    localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function loadMediaPresentations(): MediaPresentations {
  try {
    const saved = JSON.parse(
      localStorage.getItem(MEDIA_PRESENTATIONS_KEY) || '{}',
    );
    return { ...DEFAULT_MEDIA_PRESENTATIONS, ...saved };
  } catch {
    return { ...DEFAULT_MEDIA_PRESENTATIONS };
  }
}

function saveMediaPresentations(value: MediaPresentations): void {
  try {
    localStorage.setItem(MEDIA_PRESENTATIONS_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const useAssistantResponseSettingsStore = defineStore(
  'assistant-response-settings',
  () => {
    /** Global default every conversation inherits unless overridden. */
    const defaultMediaPriority = ref<MediaPriority>(loadMediaPriority());
    /** Per-conversation overrides keyed by conversation id. */
    const conversationMediaPriorities = ref<Record<string, MediaPriority>>(
      loadConversationMediaPriorities(),
    );
    /** Whether each response section type is collapsed. */
    const collapsedSections = ref<CollapsedSections>(loadCollapsedSections());
    /** Which presentation each media section renders in (gallery or list). */
    const mediaPresentations = ref<MediaPresentations>(
      loadMediaPresentations(),
    );

    watch(defaultMediaPriority, saveMediaPriority);
    watch(conversationMediaPriorities, saveConversationMediaPriorities, {
      deep: true,
    });
    watch(collapsedSections, saveCollapsedSections, { deep: true });
    watch(mediaPresentations, saveMediaPresentations, { deep: true });

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
