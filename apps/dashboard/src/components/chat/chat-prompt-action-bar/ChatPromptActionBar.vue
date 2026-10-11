<script setup lang="ts">
import { onActivated } from 'vue';

import { useAppStore } from '@/stores/app';

import { useChatContextSize } from '../composables/use-chat-context-size';
import { useChatDropdowns } from '../composables/use-chat-dropdowns';
import { useChatInput } from '../composables/use-chat-input';
import { useChatThink } from '../composables/use-chat-think';
import { usePromptDraft } from '../composables/use-prompt-draft';
import { useSearchEngineAvailability } from '../composables/use-search-engine-availability';
import { useChatPromptActionBar } from './composables/use-chat-prompt-action-bar.composable';
import { useFileSelect } from './composables/use-file-select.composable';
import FileInput from './file-input/FileInput.vue';
import PromptActions from './prompt-actions/PromptActions.vue';
import PromptInput from './prompt-input/PromptInput.vue';
import PromptMenu from './prompt-menu/PromptMenu.vue';
import SourcesMenu from './source-tags-strip/sources-menu/SourcesMenu.vue';
import SourceTagsStrip from './source-tags-strip/SourceTagsStrip.vue';
import ViewMenu from './source-tags-strip/view-menu/ViewMenu.vue';

const appStore = useAppStore();
const {
  toggleSectionCollapsed: toggleSection,
  toggleMediaPresentation: togglePresentation,
} = appStore;

const { filteredThinkOptions, selectThink } = useChatThink();
const { filteredContextSizeOptions, selectContextSize } = useChatContextSize();

const {
  setThinkDropdownRef,
  setContextSizeDropdownRef,
  onThinkOpen,
  onContextSizeOpen,
} = useChatDropdowns();

const { onCollapsedKeydown } = useChatInput();
const { promptDraft } = usePromptDraft();

const {
  searchEngineState,
  eodhdState,
  refresh,
  toggleSearchEngine,
  toggleSource,
  toggleEodhd,
} = useSearchEngineAvailability();

const {
  isFileSelectDisabled,
  acceptedFileTypes,
  setFileInputRef,
  triggerFileSelect,
  onFilesSelect,
} = useFileSelect();

const {
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
  presentationToggles,
  currentThinkValue,
  currentContextSizeValue,
  hasNoModelSelected,
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

    <FileInput
      :ref="setFileInputRef"
      :accept="acceptedFileTypes"
      @select="onFilesSelect"
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
</style>
