<script setup lang="ts">
/**
 * One compact row of the history list: a prompt preview (marquee for the
 * active row) on the left and the per-row actions on the right — copy,
 * include/exclude, merge select, branch, delete. The row is flat (no expand
 * toggle): history rows never reveal a body, they jump the exchange list to
 * the prompt's section on click.
 */
import {
  Copy,
  GitBranch,
  SquaresExclude,
  SquaresUnite,
  Trash2,
} from '@lucide/vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import Marquee from '@/components/shared/ui/marquee/Marquee.vue';
import MotionIcon from '@/components/shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import type { HistoryListItemProps } from './HistoryListItem.types';

defineProps<HistoryListItemProps>();

const emit = defineEmits<{
  select: [];
  copy: [];
  toggleInclude: [];
  toggleMerge: [];
  deleteItem: [];
  branchOut: [];
}>();
</script>

<template>
  <div
    class="history-list-item"
    :class="{
      'history-list-item--excluded': item.included === false,
      'history-list-item--merged': item.merged,
      'history-list-item--active': active,
    }"
    @click="emit('select')"
  >
    <Marquee
      v-if="active"
      class="history-list-item__marquee"
      :text="item.content"
    />
    <span v-else class="history-list-item__preview">{{ item.content }}</span>

    <span class="history-list-item__actions">
      <Tooltip :text="$t('common.contextWindowUsed')">
        <span v-if="item.contextPercent" class="history-list-item__percent">
          {{ item.contextPercent }}%
        </span>
      </Tooltip>

      <IconButton
        v-if="iconVisibility?.copy !== false"
        size="sm"
        :title="$t('common.copy')"
        @click.stop="emit('copy')"
      >
        <Copy />
      </IconButton>

      <Tooltip
        :text="
          item.included
            ? $t('common.excludeFromContext')
            : $t('common.includeInContext')
        "
      >
        <button
          v-if="
            item.included !== undefined && iconVisibility?.include !== false
          "
          type="button"
          class="history-list-item__include"
          :class="{
            'history-list-item__include--excluded': !item.included,
          }"
          :aria-label="
            item.included
              ? $t('common.excludeFromContext')
              : $t('common.includeInContext')
          "
          :aria-pressed="!item.included"
          @click.stop="emit('toggleInclude')"
        >
          <MotionIcon>
            <SquaresExclude class="history-list-item__icon" />
          </MotionIcon>
        </button>
      </Tooltip>

      <Tooltip
        :text="
          item.mergedRequestId
            ? $t('common.mergeConsumedHint', {
                requestId: item.mergedRequestId,
              })
            : item.included === false
              ? $t('common.mergeExcludedHint')
              : $t('common.mergeSelection')
        "
      >
        <button
          v-if="item.included !== undefined"
          type="button"
          class="history-list-item__merge"
          :class="{
            'history-list-item__merge--selected': item.mergeSelected,
            'history-list-item__merge--consumed':
              !item.mergeSelected && !!item.mergedRequestId,
            'history-list-item__merge--pulse': item.mergeSelected && mergeArmed,
          }"
          :aria-label="
            item.mergedRequestId
              ? $t('common.mergeConsumedHint', {
                  requestId: item.mergedRequestId,
                })
              : item.included === false
                ? $t('common.mergeExcludedHint')
                : $t('common.mergeSelection')
          "
          :aria-pressed="item.mergeSelected"
          :disabled="
            !canMerge || (item.included === false && !item.mergedRequestId)
          "
          @click.stop="emit('toggleMerge')"
        >
          <MotionIcon>
            <SquaresUnite class="history-list-item__icon" />
          </MotionIcon>
        </button>
      </Tooltip>

      <Tooltip :text="$t('common.branchOut')">
        <button
          v-if="iconVisibility?.branch !== false"
          type="button"
          class="history-list-item__branch"
          :aria-label="$t('common.branchOut')"
          @click.stop="emit('branchOut')"
        >
          <MotionIcon>
            <GitBranch class="history-list-item__icon" />
          </MotionIcon>
        </button>
      </Tooltip>

      <Tooltip :text="$t('common.deleteFromHistory')">
        <button
          v-if="item.included !== undefined && iconVisibility?.delete !== false"
          type="button"
          class="history-list-item__delete"
          :aria-label="$t('common.deleteFromHistory')"
          @click.stop="emit('deleteItem')"
        >
          <MotionIcon>
            <Trash2 class="history-list-item__icon" />
          </MotionIcon>
        </button>
      </Tooltip>
    </span>
  </div>
</template>

<style scoped>
.history-list-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2);
  text-align: left;
  cursor: pointer;
  border: 1px solid transparent;
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 5%,
    transparent
  );
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.history-list-item:hover {
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
}

.history-list-item:active {
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 20%,
    transparent
  );
  transition: none;
}

.history-list-item--excluded {
  opacity: 0.45;
}

/* Consumed by a completed merge: purple tint marks the consolidated
   section while the row stays readable in the history list. */
.history-list-item--merged {
  background-color: color-mix(
    in srgb,
    var(--color-merge-merged) 8%,
    transparent
  );
}

.history-list-item--active {
  border-color: color-mix(
    in srgb,
    var(--color-accent-primary) 60%,
    transparent
  );
  box-shadow: 0 0 0 1px
    color-mix(in srgb, var(--color-accent-primary) 40%, transparent);
}

.history-list-item__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
}

.history-list-item__percent {
  flex-shrink: 0;
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.history-list-item__include,
.history-list-item__merge,
.history-list-item__branch,
.history-list-item__delete {
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

.history-list-item__include:hover,
.history-list-item__include--excluded {
  color: var(--color-accent-primary);
}

.history-list-item__delete:hover {
  color: var(--color-status-error);
}

.history-list-item__merge:hover {
  color: var(--color-merge-selected);
}

.history-list-item__merge--selected {
  color: var(--color-merge-selected);
}

/* Consumed by a completed merge: red, still selectable. Declared before
   --selected so a fresh selection (green) wins over the red state. */
.history-list-item__merge--consumed {
  color: var(--color-merge-consumed);
}

.history-list-item__merge--consumed:hover {
  color: var(--color-merge-consumed);
}

/* Fewer than two candidates: no merge possible, button is inert. */
.history-list-item__merge:disabled,
.history-list-item__merge:disabled:hover {
  color: color-mix(in srgb, var(--color-fg-muted) 40%, transparent);
  cursor: not-allowed;
}

/* Armed merge (2+ selected): picked icons pulse to signal readiness. */
@keyframes history-list-item__merge-pulse {
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

.history-list-item__merge--pulse {
  animation: history-list-item__merge-pulse 1.1s ease-in-out infinite;
}

.history-list-item__branch:hover {
  color: var(--color-accent-primary);
}

.history-list-item__icon {
  width: 0.75rem;
  height: 0.75rem;
}

.history-list-item__preview {
  flex: 1;
  min-width: 0;
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: color-mix(in srgb, var(--color-fg-muted) 50%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Active item: the preview scrolls as a seamless marquee, matching the
   playlist now-playing treatment. */
.history-list-item__marquee {
  flex: 1;
  min-width: 0;
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: color-mix(in srgb, var(--color-fg-muted) 50%, transparent);
}
</style>
