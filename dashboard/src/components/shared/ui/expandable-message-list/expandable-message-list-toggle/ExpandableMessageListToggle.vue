<script setup lang="ts">
import {
  ChevronDown,
  Copy,
  GitBranch,
  SquaresExclude,
  SquaresUnite,
  Trash2,
} from '@lucide/vue';
import { computed } from 'vue';

import type { ChatIconVisibility } from '@/types/app.model';

import IconButton from '../../icon-button/IconButton.vue';
import Marquee from '../../marquee/Marquee.vue';
import MotionIcon from '../../motion-icon/MotionIcon.vue';
import Tooltip from '../../tooltip/Tooltip.vue';

function stripHtml(html: string): string {
  let result = '';
  let inTag = false;
  for (const ch of html) {
    if (ch === '<') inTag = true;
    else if (ch === '>') inTag = false;
    else if (!inTag) result += ch;
  }
  return result;
}

const props = withDefaults(
  defineProps<{
    expanded: boolean;
    role: string;
    content: string;
    hasBody: boolean;
    renderHtml?: (content: string) => string;
    included?: boolean;
    contextPercent?: string;
    showRole?: boolean;
    showBranch?: boolean;
    /** Which action icons to show. Omitted keys default to visible. */
    iconVisibility?: Partial<ChatIconVisibility>;
    /** Whether this item is the currently-active one (marquee its preview). */
    active?: boolean;
    /** True while this item is selected for a merge (green). */
    mergeSelected?: boolean;
    /** Request id of the merge that consumed this item (red icon). */
    mergedRequestId?: string;
    /** False when the conversation has fewer than two merge candidates —
     * the merge button grays out. */
    canMerge?: boolean;
    /** True when at least two user prompts are selected — merge icons pulse. */
    mergeArmed?: boolean;
  }>(),
  {
    renderHtml: undefined,
    included: undefined,
    contextPercent: undefined,
    showRole: true,
    showBranch: false,
    iconVisibility: undefined,
    active: false,
    mergeSelected: false,
    mergedRequestId: undefined,
    canMerge: false,
    mergeArmed: false,
  },
);

/** Plain-text preview of the content (HTML stripped) for the marquee and static preview. */
const previewText = computed(() =>
  props.renderHtml
    ? stripHtml(props.renderHtml(props.content))
    : stripHtml(props.content),
);

defineEmits<{
  toggle: [];
  select: [];
  copy: [];
  toggleInclude: [];
  toggleMerge: [];
  deleteItem: [];
  branchOut: [];
}>();
</script>

<template>
  <div class="expandable-message-list__toggle" @click="$emit('select')">
    <span
      v-if="hasBody"
      class="expandable-message-list__toggle-chevron"
      data-testid="expandable-message-list-toggle"
      @click.stop="$emit('toggle')"
    >
      <MotionIcon>
        <ChevronDown
          :class="{
            'expandable-message-list__toggle-chevron-icon--expanded': expanded,
          }"
          class="expandable-message-list__toggle-chevron-icon"
        />
      </MotionIcon>
    </span>
    <span v-if="showRole" class="expandable-message-list__toggle-role">{{
      role
    }}</span>
    <Marquee
      v-if="active"
      class="expandable-message-list__toggle-marquee"
      :text="previewText"
    />
    <span v-else class="expandable-message-list__toggle-preview">
      {{ previewText }}
    </span>
    <span class="expandable-message-list__toggle-actions">
      <Tooltip :text="$t('common.contextWindowUsed')">
        <span
          v-if="contextPercent"
          class="expandable-message-list__toggle-percent"
          >{{ contextPercent }}%</span
        >
      </Tooltip>
      <IconButton
        v-if="iconVisibility?.copy !== false"
        size="sm"
        :title="$t('common.copy')"
        @click.stop="$emit('copy')"
      >
        <Copy />
      </IconButton>
      <Tooltip
        :text="
          included
            ? $t('common.excludeFromContext')
            : $t('common.includeInContext')
        "
      >
        <button
          v-if="included !== undefined && iconVisibility?.include !== false"
          type="button"
          class="expandable-message-list__toggle-include"
          :class="{
            'expandable-message-list__toggle-include--excluded': !included,
          }"
          :aria-label="
            included
              ? $t('common.excludeFromContext')
              : $t('common.includeInContext')
          "
          :aria-pressed="!included"
          @click.stop="$emit('toggleInclude')"
        >
          <MotionIcon>
            <SquaresExclude class="expandable-message-list__include-icon" />
          </MotionIcon>
        </button>
      </Tooltip>
      <Tooltip
        :text="
          mergedRequestId
            ? $t('common.mergeConsumedHint', { requestId: mergedRequestId })
            : included === false
              ? $t('common.mergeExcludedHint')
              : $t('common.mergeSelection')
        "
      >
        <button
          v-if="included !== undefined"
          type="button"
          class="expandable-message-list__toggle-merge"
          :class="{
            'expandable-message-list__toggle-merge--selected': mergeSelected,
            'expandable-message-list__toggle-merge--consumed':
              !mergeSelected && !!mergedRequestId,
            'expandable-message-list__toggle-merge--pulse':
              mergeSelected && mergeArmed,
          }"
          :aria-label="
            mergedRequestId
              ? $t('common.mergeConsumedHint', { requestId: mergedRequestId })
              : included === false
                ? $t('common.mergeExcludedHint')
                : $t('common.mergeSelection')
          "
          :aria-pressed="mergeSelected"
          :disabled="!canMerge || (included === false && !mergedRequestId)"
          @click.stop="$emit('toggleMerge')"
        >
          <MotionIcon>
            <SquaresUnite class="expandable-message-list__include-icon" />
          </MotionIcon>
        </button>
      </Tooltip>
      <Tooltip :text="$t('common.branchOut')">
        <button
          v-if="showBranch && iconVisibility?.branch !== false"
          type="button"
          class="expandable-message-list__toggle-branch"
          :aria-label="$t('common.branchOut')"
          @click.stop="$emit('branchOut')"
        >
          <MotionIcon>
            <GitBranch class="expandable-message-list__include-icon" />
          </MotionIcon>
        </button>
      </Tooltip>
      <Tooltip :text="$t('common.deleteFromHistory')">
        <button
          v-if="included !== undefined && iconVisibility?.delete !== false"
          type="button"
          class="expandable-message-list__toggle-delete"
          :aria-label="$t('common.deleteFromHistory')"
          @click.stop="$emit('deleteItem')"
        >
          <MotionIcon>
            <Trash2 class="expandable-message-list__include-icon" />
          </MotionIcon>
        </button>
      </Tooltip>
    </span>
  </div>
</template>

<style scoped>
.expandable-message-list__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  text-align: left;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.expandable-message-list__toggle:hover {
  background-color: color-mix(in srgb, var(--color-tab-debug) 10%, transparent);
}

.expandable-message-list__toggle:active {
  background-color: color-mix(in srgb, var(--color-tab-debug) 20%, transparent);
  transition: none;
}

.expandable-message-list__toggle-chevron {
  flex-shrink: 0;
  cursor: pointer;
  padding: var(--spacing-0-5);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.expandable-message-list__toggle-chevron:hover
  .expandable-message-list__toggle-chevron-icon {
  color: var(--color-tab-debug);
}

.expandable-message-list__toggle-chevron-icon {
  display: block;
  width: 0.75rem;
  height: 0.75rem;
  color: color-mix(in srgb, var(--color-tab-debug) 70%, transparent);
  transition: transform 200ms ease;
}

.expandable-message-list__toggle-chevron-icon--expanded {
  transform: rotate(180deg);
}

.expandable-message-list__toggle-role {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--color-fg-muted);
  text-transform: uppercase;
  flex-shrink: 0;
}

.expandable-message-list__toggle-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
}

.expandable-message-list__toggle-percent {
  flex-shrink: 0;
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.expandable-message-list__toggle-include {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: var(--spacing-0-5);
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.expandable-message-list__toggle-include:hover,
.expandable-message-list__toggle-include--excluded {
  color: var(--color-accent-primary);
}

.expandable-message-list__toggle-delete {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: var(--spacing-0-5);
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.expandable-message-list__toggle-delete:hover {
  color: var(--color-status-error);
}

.expandable-message-list__toggle-merge {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: var(--spacing-0-5);
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.expandable-message-list__toggle-merge:hover {
  color: var(--color-merge-selected);
}

.expandable-message-list__toggle-merge--selected {
  color: var(--color-merge-selected);
}

/* Consumed by a completed merge: red, still selectable. Declared before
   --selected so a fresh selection (green) wins over the red state. */
.expandable-message-list__toggle-merge--consumed {
  color: var(--color-merge-consumed);
}

.expandable-message-list__toggle-merge--consumed:hover {
  color: var(--color-merge-consumed);
}

/* Fewer than two candidates: no merge possible, button is inert. */
.expandable-message-list__toggle-merge:disabled,
.expandable-message-list__toggle-merge:disabled:hover {
  color: color-mix(in srgb, var(--color-fg-muted) 40%, transparent);
  cursor: not-allowed;
}

/* Armed merge (2+ selected): picked icons pulse to signal readiness. */
@keyframes expandable-message-list__merge-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.55;
    transform: scale(1.18);
  }
}

.expandable-message-list__toggle-merge--pulse {
  animation: expandable-message-list__merge-pulse 1.1s ease-in-out infinite;
}

.expandable-message-list__toggle-branch {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: var(--spacing-0-5);
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.expandable-message-list__toggle-branch:hover {
  color: var(--color-accent-primary);
}

.expandable-message-list__include-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.expandable-message-list__toggle-preview {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: color-mix(in srgb, var(--color-fg-muted) 50%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Active item: the preview scrolls as a seamless marquee (the duplicated
   span makes the -50% wrap invisible), matching the playlist now-playing. */
.expandable-message-list__toggle-marquee {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: color-mix(in srgb, var(--color-fg-muted) 50%, transparent);
}
</style>
