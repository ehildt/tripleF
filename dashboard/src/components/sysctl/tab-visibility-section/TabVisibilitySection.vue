<script setup lang="ts">
import { Hash, Plug } from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';

defineProps<{
  isSocketsVisible: boolean;
  showCounters: boolean;
}>();

const emit = defineEmits<{
  toggleSockets: [];
  toggleCounters: [];
}>();
</script>

<template>
  <div class="tab-visibility-section__content">
    <div class="tab-visibility-section__grid">
      <FieldCard
        :icon="Plug"
        :label="$t('common.sockets')"
        :description="$t('common.socketsDesc')"
        :checked="isSocketsVisible"
        @toggle="emit('toggleSockets')"
      />
      <FieldCard
        :icon="Hash"
        :label="$t('common.counters')"
        :description="$t('common.countersDesc')"
        :checked="showCounters"
        @toggle="emit('toggleCounters')"
      />
    </div>
  </div>
</template>

<style scoped>
.tab-visibility-section__content {
  padding: var(--spacing-1);
}

.tab-visibility-section__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-1);
}
</style>
