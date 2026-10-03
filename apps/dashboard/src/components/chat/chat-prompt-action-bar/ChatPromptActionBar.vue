<script setup lang="ts">
import { onActivated } from 'vue';

import { useChatPromptActionBar } from './composables/use-chat-prompt-action-bar.composable';
import PromptActions from './prompt-actions/PromptActions.vue';
import PromptInput from './prompt-input/PromptInput.vue';
import PromptMenu from './prompt-menu/PromptMenu.vue';
import SourcesMenu from './source-tags-strip/sources-menu/SourcesMenu.vue';
import SourceTagsStrip from './source-tags-strip/SourceTagsStrip.vue';
import ViewMenu from './source-tags-strip/view-menu/ViewMenu.vue';

const {
  promptDraft,
  onCollapsedKeydown,
  onPromptFocus,
  fileSelectTitle,
  actionsClass,
  sourceTags,
  searchEngineToggleTitle,
  eodhdToggleTitle,
  noSearchEngineTitle,
  scrollMode,
  toggleScrollMode,
  scrollModeTitle,
  sourceMenuCollapsed,
  toggleSourceMenuCollapsed,
  sourceMenuToggleTitle,
  sourceMenuAlwaysShow,
  viewMenuCollapsed,
  toggleViewMenuCollapsed,
  viewMenuToggleTitle,
  viewMenuAlwaysShow,
  sectionToggles,
  toggleSection,
  presentationToggles,
  togglePresentation,
  eodhdState,
  filteredThinkOptions,
  currentThinkValue,
  selectThink,
  filteredContextSizeOptions,
  currentContextSizeValue,
  selectContextSize,
  formatContextValue,
  hasNoModelSelected,
  setThinkDropdownRef,
  setContextSizeDropdownRef,
  onThinkOpen,
  onContextSizeOpen,
  isFileSelectDisabled,
  searchEngineState,
  toggleSearchEngine,
  toggleSource,
  toggleEodhd,
  acceptedFileTypes,
  setFileInputRef,
  triggerFileSelect,
  onFileInputChange,
  refresh,
} = useChatPromptActionBar();

// KeepAlive caches Chat across tab switches, so the mount-only fetch in the
// search-engine composable never re-runs after a Settings toggle. Refresh on
// every activation so newly enabled/disabled engines reflect immediately.
onActivated(refresh);
</script>

<template>
  <div class="chat-prompt-action-bar panel-glow">
    <SourceTagsStrip
      v-if="sourceTags.length || eodhdState?.available || sectionToggles.length"
    >
      <SourcesMenu
        v-if="sourceTags.length || eodhdState?.available"
        :source-tags="sourceTags"
        :eodhd-state="eodhdState"
        :eodhd-toggle-title="eodhdToggleTitle"
        :collapsed="sourceMenuCollapsed"
        :always-show="sourceMenuAlwaysShow"
        :toggle-title="sourceMenuToggleTitle"
        @toggle="toggleSourceMenuCollapsed"
        @toggle-source="toggleSource"
        @toggle-eodhd="toggleEodhd"
      />
      <ViewMenu
        :scroll-mode="scrollMode"
        :scroll-mode-title="scrollModeTitle"
        :section-toggles="sectionToggles"
        :presentation-toggles="presentationToggles"
        :collapsed="viewMenuCollapsed"
        :always-show="viewMenuAlwaysShow"
        :toggle-title="viewMenuToggleTitle"
        @toggle="toggleViewMenuCollapsed"
        @toggle-scroll-mode="toggleScrollMode"
        @toggle-section="toggleSection"
        @toggle-presentation="togglePresentation"
      />
    </SourceTagsStrip>

    <PromptMenu>
      <PromptActions
        :actions-class="actionsClass"
        :think-options="filteredThinkOptions"
        :think-value="currentThinkValue"
        :context-size-options="filteredContextSizeOptions"
        :context-size-value="currentContextSizeValue"
        :format-context-size="formatContextValue"
        :is-disabled="hasNoModelSelected"
        :file-select-title="fileSelectTitle"
        :is-file-select-disabled="isFileSelectDisabled"
        :search-engine-state="searchEngineState"
        :search-engine-toggle-title="searchEngineToggleTitle"
        :no-search-engine-title="noSearchEngineTitle"
        :set-think-dropdown-ref="setThinkDropdownRef"
        :set-context-size-dropdown-ref="setContextSizeDropdownRef"
        @select-think="selectThink"
        @open-think="onThinkOpen"
        @select-context-size="selectContextSize"
        @open-context-size="onContextSizeOpen"
        @file-select="triggerFileSelect"
        @toggle-search-engine="toggleSearchEngine"
      />
    </PromptMenu>

    <PromptInput
      v-model="promptDraft"
      @keydown="onCollapsedKeydown"
      @focus="onPromptFocus"
    />

    <input
      :ref="setFileInputRef"
      type="file"
      name="chat-attachments"
      multiple
      :accept="acceptedFileTypes"
      class="chat-prompt-action-bar__file-input"
      @change="onFileInputChange"
    />
  </div>
</template>

<style scoped>
.chat-prompt-action-bar {
  margin-top: 1.5rem;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  background-color: var(--color-bg-tertiary);
  padding: var(--spacing-3) var(--spacing-4);
  opacity: 0.6;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.3s ease;
}

.chat-prompt-action-bar:hover {
  opacity: 1;
  transition: opacity 0.3s ease;
}

.chat-prompt-action-bar:focus-within {
  box-shadow: 0 0 0.15rem 0.05rem
    color-mix(in srgb, var(--color-accent-primary) 30%, var(--color-divider));
  opacity: 1;
}

.chat-prompt-action-bar__file-input {
  display: none;
}
</style>
