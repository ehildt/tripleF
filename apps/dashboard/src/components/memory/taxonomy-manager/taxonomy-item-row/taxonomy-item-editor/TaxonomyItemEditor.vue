<script setup lang="ts">
/**
 * The taxonomy item's inline editor: rename input, same-level merge target
 * (combo-box over the candidates, two-step armed confirm), and the curated
 * icon picker grid with a clear action. Side effects arrive as callback
 * props — nothing is re-emitted. Mounts when the row's editor opens, so its
 * draft state starts fresh; closing unmounts it.
 */
import { Check, GitMerge } from '@lucide/vue';
import { computed, ref } from 'vue';

import ComboBox from '@/components/shared/ui/combo-box/ComboBox.vue';
import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import InputText from '@/components/shared/ui/input-text/InputText.vue';

import TaxonomyItemIconPicker from './taxonomy-item-icon-picker/TaxonomyItemIconPicker.vue';
import type { TaxonomyItemEditorProps } from './TaxonomyItemEditor.types';

const props = defineProps<TaxonomyItemEditorProps>();

/** Inline editor state (fresh on every open — the component remounts). */
const draftName = ref(props.item.name);
const mergeTargetName = ref('');
const mergeArmed = ref(false);

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
  props.onMerge(target.id);
}
</script>

<template>
  <div class="taxonomy-item-editor">
    <div class="taxonomy-item-editor__field">
      <label class="taxonomy-item-editor__label">{{
        $t('common.memoryTaxonomyRename')
      }}</label>
      <InputText v-model="draftName" :placeholder="item.name" />
      <IconButton
        :title="$t('common.memoryTaxonomyRenameSave')"
        size="sm"
        :disabled="draftName.trim() === '' || draftName.trim() === item.name"
        @click="onRename(draftName)"
      >
        <Check :size="16" />
      </IconButton>
    </div>

    <div v-if="mergeCandidates.length > 0" class="taxonomy-item-editor__field">
      <label class="taxonomy-item-editor__label">{{
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

    <TaxonomyItemIconPicker
      :icon-names="iconNames"
      :selected-icon="item.icon ?? null"
      :on-select="onSetIcon"
    />
  </div>
</template>

<style scoped>
.taxonomy-item-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-top: var(--spacing-2);
  padding-top: var(--spacing-2);
  border-top: 1px dashed var(--color-divider);
}

.taxonomy-item-editor__field {
  display: grid;
  grid-template-columns: 5rem 1fr max-content;
  align-items: center;
  gap: var(--spacing-2);
}

.taxonomy-item-editor__label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-fg-muted);
}
</style>
