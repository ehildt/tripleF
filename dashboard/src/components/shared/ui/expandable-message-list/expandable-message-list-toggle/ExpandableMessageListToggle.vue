<script setup lang="ts">
import { ChevronDown, GitBranch, SendToBack, Trash2 } from '@lucide/vue';

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

withDefaults(
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
  }>(),
  {
    renderHtml: undefined,
    included: undefined,
    contextPercent: undefined,
    showRole: true,
    showBranch: false,
  },
);

defineEmits<{
  toggle: [];
  select: [];
  toggleInclude: [];
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
    <span class="expandable-message-list__toggle-preview">
      {{ renderHtml ? stripHtml(renderHtml(content)) : stripHtml(content) }}
    </span>
    <span class="expandable-message-list__toggle-actions">
      <span
        v-if="contextPercent"
        class="expandable-message-list__toggle-percent"
        >{{ contextPercent }}%</span
      >
      <Tooltip
        :text="
          included
            ? $t('common.excludeFromContext')
            : $t('common.includeInContext')
        "
      >
        <button
          v-if="included !== undefined"
          type="button"
          class="expandable-message-list__toggle-include"
          :class="{
            'expandable-message-list__toggle-include--excluded': !included,
          }"
          :aria-label="included ? 'Exclude from context' : 'Include in context'"
          :aria-pressed="!included"
          @click.stop="$emit('toggleInclude')"
        >
          <MotionIcon>
            <SendToBack class="expandable-message-list__include-icon" />
          </MotionIcon>
        </button>
      </Tooltip>
      <Tooltip :text="$t('common.branchOut')">
        <button
          v-if="showBranch"
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
          v-if="included !== undefined"
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
</style>
