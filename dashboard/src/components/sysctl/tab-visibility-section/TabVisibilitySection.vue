<script setup lang="ts">
import { Bug, Hash, MailX, Plug } from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';

defineProps<{
  isDebugVisible: boolean;
  isDlqVisible: boolean;
  isSocketsVisible: boolean;
  showCounters: boolean;
}>();

const emit = defineEmits<{
  toggleDebug: [];
  toggleDlq: [];
  toggleSockets: [];
  toggleCounters: [];
}>();
</script>

<template>
  <div class="tab-visibility-section__content">
    <div class="tab-visibility-section__grid">
      <FieldCard
        :icon="MailX"
        label="dlq"
        description="dead letter queue tab"
        :checked="isDlqVisible"
        @toggle="emit('toggleDlq')"
      />
      <FieldCard
        :icon="Bug"
        label="debug"
        description="debug tab / logging"
        :checked="isDebugVisible"
        @toggle="emit('toggleDebug')"
      />
      <FieldCard
        :icon="Plug"
        label="sockets"
        description="sockets menu + list in the chat toolbar"
        :checked="isSocketsVisible"
        @toggle="emit('toggleSockets')"
      />
      <FieldCard
        :icon="Hash"
        label="counters"
        description="show unread badge on tabs"
        :checked="showCounters"
        @toggle="emit('toggleCounters')"
      />
    </div>
  </div>
</template>

<style scoped>
.tab-visibility-section__content {
  padding: var(--spacing-4);
}

.tab-visibility-section__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-1);
}
</style>
