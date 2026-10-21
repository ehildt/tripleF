<script setup lang="ts">
import { Check, FilePenLine, Undo2, X } from '@lucide/vue';

import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import type {
  DlqPayloadToolbarEmits,
  DlqPayloadToolbarProps,
} from './DlqPayloadToolbar.types';

/**
 * The payload editor's floating toolbar: back, then exactly one action set —
 * save/cancel while editing, edit while read-only, none when immutable. Each
 * button carries its own plain `v-if`; the sets are mutually exclusive by the
 * prop combination, no else-chains needed.
 */
defineProps<DlqPayloadToolbarProps>();

const emit = defineEmits<DlqPayloadToolbarEmits>();
</script>

<template>
  <div class="dlq-payload-toolbar">
    <Tooltip v-if="showBack" :text="$t('common.back')">
      <button class="dlq-payload-toolbar__button" @click="emit('back')">
        <Undo2 class="dlq-payload-toolbar__icon" />
      </button>
    </Tooltip>
    <Tooltip v-if="!isImmutable && isEditingPayload" :text="$t('common.save')">
      <button
        class="dlq-payload-toolbar__button dlq-payload-toolbar__button--success"
        @click="emit('save')"
      >
        <Check class="dlq-payload-toolbar__icon" />
      </button>
    </Tooltip>
    <Tooltip
      v-if="!isImmutable && isEditingPayload"
      :text="$t('common.cancel')"
    >
      <button
        class="dlq-payload-toolbar__button dlq-payload-toolbar__button--error"
        @click="emit('cancel')"
      >
        <X class="dlq-payload-toolbar__icon" />
      </button>
    </Tooltip>
    <Tooltip v-if="!isImmutable && !isEditingPayload" :text="$t('common.edit')">
      <button class="dlq-payload-toolbar__button" @click="emit('edit')">
        <FilePenLine class="dlq-payload-toolbar__icon" />
      </button>
    </Tooltip>
  </div>
</template>

<style scoped>
.dlq-payload-toolbar {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.dlq-payload-toolbar__button {
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.dlq-payload-toolbar__button:hover {
  color: var(--color-fg-primary);
}

.dlq-payload-toolbar__button--success {
  color: var(--color-status-success);
}

.dlq-payload-toolbar__button--success:hover {
  background-color: color-mix(
    in srgb,
    var(--color-status-success) 10%,
    transparent
  );
}

.dlq-payload-toolbar__button--error {
  color: var(--color-status-error);
}

.dlq-payload-toolbar__button--error:hover {
  background-color: color-mix(
    in srgb,
    var(--color-status-error) 10%,
    transparent
  );
}

.dlq-payload-toolbar__icon {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
