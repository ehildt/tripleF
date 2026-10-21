<script setup lang="ts">
import { Archive, RotateCcw, Trash2 } from '@lucide/vue';
import { computed } from 'vue';

import { useDlqActionAvailability } from '../composables/use-dlq-action-availability';
import { useDlqDeleteArm } from '../composables/use-dlq-delete-arm';
import DlqActionIconButton from '../dlq-action-icon-button/DlqActionIconButton.vue';
import type {
  DlqItemActionsEmits,
  DlqItemActionsProps,
} from './DlqItemActions.types';

/**
 * The DLQ row's action column: retry / archive / delete. Availability derives
 * from the entry's status; delete is armed on the first click and fires on
 * the second (two-click confirm, no modal).
 */
const props = defineProps<DlqItemActionsProps>();

const emit = defineEmits<DlqItemActionsEmits>();

const entryStatus = computed(() => props.entry.status);
const { isRetryable, isArchivable, isDeletable } =
  useDlqActionAvailability(entryStatus);

const { isDeleteArmed, armOrConfirmDelete } = useDlqDeleteArm();

function handleDeleteClick() {
  if (armOrConfirmDelete()) {
    emit('delete', props.entry.id);
  }
}
</script>

<template>
  <div class="dlq-item-actions">
    <DlqActionIconButton
      v-if="isRetryable"
      :icon="RotateCcw"
      :tint="0"
      :visible="true"
      :title="$t('common.retry')"
      @click="emit('retry', entry.id)"
    />
    <DlqActionIconButton
      :icon="Archive"
      :tint="0.65"
      :visible="isArchivable"
      :title="$t('common.archive')"
      @click="emit('archive', entry.id)"
    />
    <DlqActionIconButton
      :icon="Trash2"
      :tint="1"
      :visible="isDeletable"
      :armed="isDeleteArmed"
      :title="
        isDeleteArmed
          ? $t('common.clickAgainConfirmDelete')
          : $t('common.delete')
      "
      @click="handleDeleteClick"
    />
  </div>
</template>

<style scoped>
.dlq-item-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
}
</style>
