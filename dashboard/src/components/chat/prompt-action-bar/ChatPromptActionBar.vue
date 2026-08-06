<script setup lang="ts">
import {
  BrainCircuit,
  CircleGauge,
  FileText,
  Film,
  Globe,
  GlobeOff,
  GlobeX,
  Image,
  type LucideIcon,
  MapPin,
  Newspaper,
  Search,
  ShoppingCart,
  Star,
  Upload,
} from '@lucide/vue';
import { computed } from 'vue';

import Dropdown from '../../shared/ui/drop-down/DropDown.vue';
import MotionIcon from '../../shared/ui/motion-icon/MotionIcon.vue';
import { type SetDropdownRef } from '../composables/use-chat-dropdowns';
import type { SearchEngineState } from '../composables/use-search-engine-availability';

const props = defineProps<{
  value: string;
  thinkOptions: readonly string[];
  thinkValue: string;
  contextSizeOptions: readonly string[];
  contextSizeValue: string;
  defaultContextSize: string;
  formatContextSize: (value: string) => string;
  isDisabled: boolean;
  isFileSelectDisabled: boolean;
  fileSelectDisabledReason?: string;
  searchEngineState?: SearchEngineState;
  /** Every toggleable search source (web, images, news, …) + its state. */
  searchSources?: { key: string; enabled: boolean }[];
  setActionBarRef: SetDropdownRef;
  setThinkDropdownRef: SetDropdownRef;
  setContextSizeDropdownRef: SetDropdownRef;
}>();

const emit = defineEmits<{
  input: [event: Event];
  keydown: [event: KeyboardEvent];
  selectThink: [think: string];
  selectContextSize: [ctx: string];
  openThink: [];
  openContextSize: [];
  disabledHoverStart: [];
  disabledHoverEnd: [];
  fileSelect: [];
  toggleSearchEngine: [];
  toggleSource: [source: string];
}>();

const fileSelectClass = computed(() => ({
  'chat-prompt-action-bar__file-button': true,
  'chat-prompt-action-bar__file-button--disabled': props.isFileSelectDisabled,
}));

const fileSelectTitle = computed(
  () => props.fileSelectDisabledReason || 'Select files',
);

const actionsClass = computed(() => ({
  'chat-prompt-action-bar__actions': true,
  'chat-prompt-action-bar__actions--with-indicator':
    props.searchEngineState !== undefined &&
    props.searchEngineState !== 'unknown',
}));

const noSearchEngineTitle =
  "No search engine connected — answers come from the model's training data. Enable one in SysCtl → Search Engines.";

/** Icon and label per known search source; unknown sources fall back to Search. */
const SOURCE_META: Record<string, { icon: LucideIcon; label: string }> = {
  web: { icon: Globe, label: 'web' },
  images: { icon: Image, label: 'images' },
  news: { icon: Newspaper, label: 'news' },
  shopping: { icon: ShoppingCart, label: 'shopping' },
  webpageFetch: { icon: FileText, label: 'fetch' },
  places: { icon: MapPin, label: 'places' },
  videos: { icon: Film, label: 'videos' },
  reviews: { icon: Star, label: 'reviews' },
};

/**
 * The tags at the top edge of the prompt input — toggle buttons, one per
 * search source, shown only while a search engine is enabled. Enabled
 * sources render colored, disabled ones gray; clicking flips the state
 * with immediate visual feedback. Kill switch off or no engine available
 * hides the strip entirely.
 */
const sourceTags = computed(() => {
  if (props.searchEngineState !== 'enabled') return [];
  return (props.searchSources ?? []).map(({ key, enabled }) => ({
    key,
    enabled,
    // Unknown sources fall back to a distinct Search icon — never one of
    // the mapped icons, so the tags never repeat.
    icon: SOURCE_META[key]?.icon ?? Search,
    label: SOURCE_META[key]?.label ?? key,
    title: enabled
      ? `${SOURCE_META[key]?.label ?? key} source enabled — click to disable`
      : `${SOURCE_META[key]?.label ?? key} source disabled — click to enable`,
  }));
});

const searchEngineToggleTitle = computed(() =>
  props.searchEngineState === 'enabled'
    ? 'Search engine connected — click to disable web search'
    : 'Search engine disabled — click to enable',
);

function onFileButtonMouseEnter() {
  if (props.isFileSelectDisabled) {
    emit('disabledHoverStart');
  }
}

function onFileButtonMouseLeave() {
  if (props.isFileSelectDisabled) {
    emit('disabledHoverEnd');
  }
}
</script>

<template>
  <div class="chat-prompt-action-bar">
    <!-- Search-source toggle icons floating on the top border, right-aligned. -->
    <div v-if="sourceTags.length" class="chat-prompt-action-bar__source-tags">
      <button
        v-for="tag in sourceTags"
        :key="tag.key"
        type="button"
        class="chat-prompt-action-bar__source-tag"
        :class="{
          'chat-prompt-action-bar__source-tag--disabled': !tag.enabled,
        }"
        :title="tag.title"
        :aria-label="tag.title"
        :aria-pressed="tag.enabled"
        @click="emit('toggleSource', tag.key)"
      >
        <component
          :is="tag.icon"
          class="chat-prompt-action-bar__source-tag-icon"
          aria-hidden="true"
        />
      </button>
    </div>
    <span class="chat-prompt-action-bar__prompt">&gt;</span>
    <textarea
      :value="props.value"
      name="prompt"
      :rows="2"
      class="chat-prompt-action-bar__input"
      style="caret-shape: block"
      aria-label="Prompt"
      placeholder="Ask the harness…"
      @input="emit('input', $event)"
      @keydown="emit('keydown', $event)"
    />
    <div :ref="props.setActionBarRef" :class="actionsClass">
      <Dropdown
        :ref="props.setThinkDropdownRef"
        variant="icon-only"
        label="Think level"
        :options="props.thinkOptions"
        :model-value="props.thinkValue"
        :disabled="props.isDisabled"
        @update:model-value="emit('selectThink', $event)"
        @open="emit('openThink')"
      >
        <MotionIcon>
          <BrainCircuit class="chat-prompt-action-bar__icon" />
        </MotionIcon>
      </Dropdown>
      <Dropdown
        :ref="props.setContextSizeDropdownRef"
        variant="icon-only"
        label="Context"
        :options="props.contextSizeOptions"
        :model-value="props.contextSizeValue"
        :disabled="props.isDisabled"
        :format-value="props.formatContextSize"
        @update:model-value="emit('selectContextSize', $event)"
        @open="emit('openContextSize')"
      >
        <MotionIcon>
          <CircleGauge class="chat-prompt-action-bar__icon" />
        </MotionIcon>
      </Dropdown>
      <button
        :class="fileSelectClass"
        :disabled="props.isFileSelectDisabled"
        :title="fileSelectTitle"
        @mouseenter="onFileButtonMouseEnter"
        @mouseleave="onFileButtonMouseLeave"
        @click="emit('fileSelect')"
      >
        <MotionIcon><Upload class="chat-prompt-action-bar__icon" /></MotionIcon>
      </button>
      <button
        v-if="
          props.searchEngineState === 'enabled' ||
          props.searchEngineState === 'disabled'
        "
        class="chat-prompt-action-bar__search-toggle"
        :title="searchEngineToggleTitle"
        :aria-label="searchEngineToggleTitle"
        @click="emit('toggleSearchEngine')"
      >
        <MotionIcon>
          <Globe
            v-if="props.searchEngineState === 'enabled'"
            class="chat-prompt-action-bar__icon"
          />
          <GlobeX v-else class="chat-prompt-action-bar__icon" />
        </MotionIcon>
      </button>
      <span
        v-else-if="props.searchEngineState === 'unavailable'"
        class="chat-prompt-action-bar__offline-indicator"
        :title="noSearchEngineTitle"
        role="img"
        aria-label="No search engine connected"
      >
        <GlobeOff class="chat-prompt-action-bar__icon" />
      </span>
    </div>
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

/* Search-source icons floating on the prompt area's top border, aligned
   right; the bar background punches the border line out behind them. The
   z-index + pointer-events keep the strip clickable — without them the
   overlapping exchange content swallows the clicks before the buttons. */
.chat-prompt-action-bar__source-tags {
  position: absolute;
  top: 0;
  right: 1.1rem;
  z-index: 10;
  pointer-events: auto;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: 0 var(--spacing-1);
}

.chat-prompt-action-bar__source-tag {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-accent-primary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.chat-prompt-action-bar__source-tag--disabled {
  color: var(--color-fg-muted);
}

.chat-prompt-action-bar__source-tag:hover {
  color: var(--color-accent-secondary);
}

.chat-prompt-action-bar__source-tag-icon {
  width: 0.8rem;
  height: 0.8rem;
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

.chat-prompt-action-bar__prompt {
  color: var(--color-tab-rest);
  font-family: var(--font-mono);
  line-height: 1.5rem;
  user-select: none;
}

.chat-prompt-action-bar__input {
  flex: 1 1 0%;
  min-width: 0;
  background-color: transparent;
  border: none;
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  resize: none;
  outline: none;
}

.chat-prompt-action-bar__input::placeholder {
  color: var(--color-fg-muted);
}

.chat-prompt-action-bar__input:disabled {
  opacity: 0.5;
  cursor: default;
}

.chat-prompt-action-bar__actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-1-5);
  align-self: center;
}

.chat-prompt-action-bar__actions--with-indicator {
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
}

.chat-prompt-action-bar__offline-indicator {
  display: flex;
  align-items: center;
  padding: var(--spacing-1);
  color: var(--color-status-warning);
  cursor: help;
}

.chat-prompt-action-bar__search-toggle {
  display: flex;
  align-items: center;
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  cursor: pointer;
  border: none;
  background-color: transparent;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.chat-prompt-action-bar__search-toggle:hover {
  color: var(--color-accent-primary);
  background-color: var(--color-bg-tertiary);
}

.chat-prompt-action-bar__icon {
  width: 1rem;
  height: 1rem;
}

.chat-prompt-action-bar__file-button {
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
  border: none;
  background-color: transparent;
}

.chat-prompt-action-bar__file-button:hover:not(:disabled) {
  color: var(--color-accent-primary);
  background-color: var(--color-bg-tertiary);
}

.chat-prompt-action-bar__file-button--disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
