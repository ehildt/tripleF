<script setup lang="ts">
import {
  type ChatPromptActionBarEmits,
  useChatPromptActionBar,
} from './composables/use-chat-prompt-action-bar.composable';
import PromptActions from './prompt-actions/PromptActions.vue';
import PromptInput from './prompt-input/PromptInput.vue';
import SourcesMenu from './source-tags-strip/sources-menu/SourcesMenu.vue';
import SourceTagsStrip from './source-tags-strip/SourceTagsStrip.vue';
import ViewMenu from './source-tags-strip/view-menu/ViewMenu.vue';
import type { ChatPromptActionBarProps } from './ChatPromptActionBar.types';

const props = defineProps<ChatPromptActionBarProps>();

const emit = defineEmits<ChatPromptActionBarEmits>();

const {
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
  onFileButtonMouseEnter,
  onFileButtonMouseLeave,
} = useChatPromptActionBar(props, emit);
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
        @toggle-source="emit('toggleSource', $event)"
        @toggle-eodhd="emit('toggleEodhd')"
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

    <PromptInput
      :value="props.value"
      @input="emit('input', $event)"
      @keydown="emit('keydown', $event)"
      @focus="emit('focus')"
    />

    <PromptActions
      :actions-class="actionsClass"
      :think-options="props.thinkOptions"
      :think-value="props.thinkValue"
      :context-size-options="props.contextSizeOptions"
      :context-size-value="props.contextSizeValue"
      :default-context-size="props.defaultContextSize"
      :format-context-size="props.formatContextSize"
      :is-disabled="props.isDisabled"
      :file-select-title="fileSelectTitle"
      :is-file-select-disabled="props.isFileSelectDisabled"
      :search-engine-state="props.searchEngineState"
      :search-engine-toggle-title="searchEngineToggleTitle"
      :no-search-engine-title="noSearchEngineTitle"
      :set-action-bar-ref="props.setActionBarRef"
      :set-think-dropdown-ref="props.setThinkDropdownRef"
      :set-context-size-dropdown-ref="props.setContextSizeDropdownRef"
      @select-think="emit('selectThink', $event)"
      @open-think="emit('openThink')"
      @select-context-size="emit('selectContextSize', $event)"
      @open-context-size="emit('openContextSize')"
      @file-select="emit('fileSelect')"
      @toggle-search-engine="emit('toggleSearchEngine')"
      @file-button-mouse-enter="onFileButtonMouseEnter"
      @file-button-mouse-leave="onFileButtonMouseLeave"
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
