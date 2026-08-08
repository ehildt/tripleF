<script setup lang="ts">
/**
 * Dynamic source config: preferred domains get a rank boost and prompt
 * guidance; blocked domains are dropped from the tool context entirely.
 * One entry per line — a hostname (subdomains match) or a /regex/ pattern
 * against the hostname. Changes apply to new requests on save (change).
 */
import { Ban, ThumbsUp } from '@lucide/vue';
import { nextTick, ref, watch } from 'vue';

import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';

import type { SourcesConfig } from '../../sysctl-config.model';
import { parseSourceList } from './helpers/parse-source-list.helper';

const props = defineProps<{
  sources: SourcesConfig;
}>();

const emit = defineEmits<{
  (
    e: 'patch',
    payload: { key: 'preferred' | 'blocked'; value: string[] },
  ): void;
  (e: 'reset', key: 'preferred' | 'blocked'): void;
}>();

const preferredDraft = ref('');
const blockedDraft = ref('');
const preferredInput = ref<HTMLTextAreaElement>();
const blockedInput = ref<HTMLTextAreaElement>();

/** Grow the textarea with its content until it hits max-height, then scroll. */
function autoResize(el: HTMLTextAreaElement | undefined) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 256)}px`;
}

watch(
  () => [props.sources?.preferred, props.sources?.blocked],
  async ([preferred, blocked]) => {
    preferredDraft.value = (preferred ?? []).join('\n');
    blockedDraft.value = (blocked ?? []).join('\n');
    await nextTick();
    autoResize(preferredInput.value);
    autoResize(blockedInput.value);
  },
  { immediate: true },
);

function save(key: 'preferred' | 'blocked') {
  const draft = key === 'preferred' ? preferredDraft : blockedDraft;
  emit('patch', { key, value: parseSourceList(draft.value) });
}
</script>

<template>
  <div class="sources-panel">
    <!-- One line, gap-1: label block on top, text input below it -->
    <div class="sources-panel__card">
      <div class="sources-panel__header">
        <div class="sources-panel__icon">
          <ThumbsUp class="sources-panel__icon-glyph" />
        </div>
        <div class="sources-panel__content">
          <span class="sources-panel__label">{{
            $t('common.preferredSources')
          }}</span>
          <span class="sources-panel__description">
            {{ $t('common.sourcesPreferredHint') }}
          </span>
        </div>
        <ResetButton
          :title="$t('common.resetPreferredSources')"
          @click="emit('reset', 'preferred')"
        />
      </div>
      <textarea
        ref="preferredInput"
        v-model="preferredDraft"
        name="preferred-sources"
        class="sources-panel__input"
        rows="6"
        placeholder="bbc.com&#10;arstechnica.com"
        autocomplete="off"
        spellcheck="false"
        @input="autoResize(preferredInput)"
        @change="save('preferred')"
      />
    </div>

    <div class="sources-panel__card">
      <div class="sources-panel__header">
        <div class="sources-panel__icon">
          <Ban class="sources-panel__icon-glyph" />
        </div>
        <div class="sources-panel__content">
          <span class="sources-panel__label">{{
            $t('common.blockedSources')
          }}</span>
          <span class="sources-panel__description">
            {{ $t('common.sourcesBlockedHint') }}
          </span>
        </div>
        <ResetButton
          :title="$t('common.resetBlockedSources')"
          @click="emit('reset', 'blocked')"
        />
      </div>
      <textarea
        ref="blockedInput"
        v-model="blockedDraft"
        name="blocked-sources"
        class="sources-panel__input"
        rows="6"
        placeholder="*.pinterest.com&#10;/^lh\d+\.googleusercontent\.com$/"
        autocomplete="off"
        spellcheck="false"
        @input="autoResize(blockedInput)"
        @change="save('blocked')"
      />
    </div>
  </div>
</template>

<style scoped>
.sources-panel {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-1);
}

.sources-panel__card {
  flex: 1;
  gap: var(--spacing-1);
  min-width: 0;
  display: flex;
  flex-direction: column;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
}

.sources-panel__card:hover {
  filter: brightness(1.08);
}

/* Header row (field-card look): icon tile + label + description */
.sources-panel__header {
  background-color: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
}

.sources-panel__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.sources-panel__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.sources-panel__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.sources-panel__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}

.sources-panel__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}

.sources-panel__input {
  width: 100%;
  max-height: 16rem;
  padding: var(--spacing-2) var(--spacing-3);
  border: none;

  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  outline: none;
  resize: none;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.sources-panel__input::placeholder {
  color: var(--color-fg-muted);
  opacity: 0.5;
}

/* Stack the two cards on narrow SysCtl widths */
@media (max-width: 720px) {
  .sources-panel {
    flex-direction: column;
  }
}
</style>
