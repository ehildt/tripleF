<script setup lang="ts">
/**
 * One taxonomy node row: icon chip + label (+ parent disambiguation), the
 * operational meta (leaves/linked/children, maintenance stamps, alias
 * trail), and an edit toggle that expands the inline editor — rename,
 * merge target (combo-box over same-tier candidates), and the curated icon
 * picker grid. Presentational: all mutations emit upward.
 */
import { Check, GitMerge, Pencil, Shapes, X } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

import ComboBox from '@/components/shared/ui/combo-box/ComboBox.vue';
import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import InputText from '@/components/shared/ui/input-text/InputText.vue';
import TaxonomyIcon from '@/components/shared/ui/taxonomy-icon/TaxonomyIcon.vue';

import type {
  TaxonomyNodeRowEmits,
  TaxonomyNodeRowProps,
} from './TaxonomyNodeRow.types';

const props = defineProps<TaxonomyNodeRowProps>();
const emit = defineEmits<TaxonomyNodeRowEmits>();

/** Inline editor state (reset when the editor closes). */
const draftName = ref(props.node.name);
const mergeTargetName = ref('');
const mergeArmed = ref(false);

watch(
  () => props.editing,
  (open) => {
    if (open) {
      mergeArmed.value = false;
      mergeTargetName.value = '';
      draftName.value = props.node.name;
    }
  },
);

/** Maintenance stamp rows (dates only — the constellation carries the rest). */
const stamps = computed(() => {
  const rows: Array<{ label: string; value: string }> = [];
  if (props.node.lastReflectedAt) {
    rows.push({
      label: 'reflected',
      value: props.node.lastReflectedAt.slice(0, 10),
    });
  }
  if (props.node.lastConsolidatedAt) {
    rows.push({
      label: 'consolidated',
      value: props.node.lastConsolidatedAt.slice(0, 10),
    });
  }
  if (props.node.lastRelinkedAt) {
    rows.push({
      label: 'relinked',
      value: props.node.lastRelinkedAt.slice(0, 10),
    });
  }
  return rows;
});

/** Merge options are candidate display labels (id resolution on confirm). */
const mergeOptions = computed(() =>
  props.mergeCandidates.map((candidate) => props.candidateLabel(candidate)),
);

/** Resolve the picked label to its candidate id. */
function confirmMerge(): void {
  const target = props.mergeCandidates.find(
    (candidate) => props.candidateLabel(candidate) === mergeTargetName.value,
  );
  if (!target) return;
  emit('merge', target.id);
}
</script>

<template>
  <li
    class="taxonomy-node-row"
    :class="{ 'taxonomy-node-row--editing': editing }"
  >
    <div class="taxonomy-node-row__main">
      <span class="taxonomy-node-row__icon" :title="node.icon ?? ''">
        <TaxonomyIcon v-if="node.icon" :name="node.icon" :size="16" />
        <Shapes v-else :size="16" />
      </span>
      <div class="taxonomy-node-row__identity">
        <span class="taxonomy-node-row__name">{{ candidateLabel(node) }}</span>
        <span class="taxonomy-node-row__meta">
          {{
            $t('common.memoryTaxonomyRowMeta', {
              leaves: node.leafCount,
              linked: node.linkedCount,
              children: node.childCount,
            })
          }}
        </span>
        <span
          v-if="stamps.length > 0"
          class="taxonomy-node-row__stamps"
          :title="stamps.map((row) => `${row.label}: ${row.value}`).join('\n')"
        >
          {{ stamps.map((row) => `${row.label} ${row.value}`).join(' · ') }}
        </span>
        <span
          v-if="node.aliases.length > 0"
          class="taxonomy-node-row__aliases"
          :title="
            node.aliases.map((a) => `${a.alias} (${a.source})`).join('\n')
          "
        >
          {{
            $t('common.memoryTaxonomyAliases', {
              count: node.aliases.length,
            })
          }}
        </span>
      </div>
      <IconButton
        :title="$t('common.memoryTaxonomyEdit')"
        size="sm"
        :active="editing"
        @click="emit('toggleEdit')"
      >
        <Pencil :size="16" />
      </IconButton>
    </div>

    <div v-if="editing" class="taxonomy-node-row__editor">
      <div class="taxonomy-node-row__field">
        <label class="taxonomy-node-row__label">{{
          $t('common.memoryTaxonomyRename')
        }}</label>
        <InputText v-model="draftName" :placeholder="node.name" />
        <IconButton
          :title="$t('common.memoryTaxonomyRenameSave')"
          size="sm"
          :disabled="draftName.trim() === '' || draftName.trim() === node.name"
          @click="emit('rename', draftName)"
        >
          <Check :size="16" />
        </IconButton>
      </div>

      <div v-if="mergeCandidates.length > 0" class="taxonomy-node-row__field">
        <label class="taxonomy-node-row__label">{{
          $t('common.memoryTaxonomyMergeInto')
        }}</label>
        <ComboBox
          v-model="mergeTargetName"
          :options="mergeOptions"
          :placeholder="$t('common.memoryTaxonomyMergePlaceholder')"
        />
        <IconButton
          :title="$t('common.memoryTaxonomyMergeConfirm')"
          size="sm"
          danger
          :armed="mergeArmed"
          :disabled="mergeTargetName === ''"
          @click="mergeArmed ? confirmMerge() : (mergeArmed = true)"
        >
          <GitMerge :size="16" />
        </IconButton>
      </div>

      <div class="taxonomy-node-row__icons">
        <div class="taxonomy-node-row__icons-head">
          <label class="taxonomy-node-row__label">{{
            $t('common.memoryTaxonomyIcon')
          }}</label>
          <IconButton
            v-if="node.icon"
            :title="$t('common.memoryTaxonomyIconClear')"
            size="sm"
            @click="emit('setIcon', null)"
          >
            <X :size="16" />
          </IconButton>
        </div>
        <div class="taxonomy-node-row__icon-grid">
          <button
            v-for="name in iconNames"
            :key="name"
            type="button"
            class="taxonomy-node-row__icon-choice"
            :class="{
              'taxonomy-node-row__icon-choice--active': node.icon === name,
            }"
            :title="name"
            :aria-pressed="node.icon === name"
            @click="emit('setIcon', name)"
          >
            <TaxonomyIcon :name="name" :size="16" />
          </button>
        </div>
      </div>
    </div>
  </li>
</template>

<style scoped>
.taxonomy-node-row {
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 1px solid var(--color-divider);
}

.taxonomy-node-row--editing {
  background-color: var(--color-bg-elevated);
}

.taxonomy-node-row__main {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.taxonomy-node-row__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  color: var(--color-fg-secondary);
  border: 1px solid var(--color-divider);
  border-radius: var(--spacing-1);
}

.taxonomy-node-row__identity {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
}

.taxonomy-node-row__name {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-fg-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.taxonomy-node-row__meta,
.taxonomy-node-row__stamps,
.taxonomy-node-row__aliases {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.taxonomy-node-row__aliases {
  font-style: italic;
}

.taxonomy-node-row__editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-top: var(--spacing-2);
  padding-top: var(--spacing-2);
  border-top: 1px dashed var(--color-divider);
}

.taxonomy-node-row__field {
  display: grid;
  grid-template-columns: 5rem 1fr max-content;
  align-items: center;
  gap: var(--spacing-2);
}

.taxonomy-node-row__label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-fg-muted);
}

.taxonomy-node-row__icons-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-2);
}

.taxonomy-node-row__icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  max-height: 9rem;
  overflow-y: auto;
}

.taxonomy-node-row__icon-choice {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  color: var(--color-fg-secondary);
  background: transparent;
  border: 1px solid var(--color-divider);
  border-radius: var(--spacing-1);
  cursor: pointer;
}

.taxonomy-node-row__icon-choice:hover {
  color: var(--color-fg-primary);
  border-color: var(--color-fg-muted);
}

.taxonomy-node-row__icon-choice--active {
  color: var(--color-accent, var(--color-fg-primary));
  border-color: var(--color-accent, var(--color-fg-primary));
}
</style>
