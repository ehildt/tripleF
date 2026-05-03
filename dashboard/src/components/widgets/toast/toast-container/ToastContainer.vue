<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';
import { Check, CircleX, Info, TriangleAlert, X } from '@lucide/vue';

import { useToastState } from '../../../../composables/toast-state';

const { toasts, remove } = useToastState();

const iconMap: Record<string, LucideIcon> = {
  success: Check,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
  default: Info,
};
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed bottom-20 right-4 z-[9999] flex flex-col-reverse gap-2"
      role="region"
      aria-label="Notifications"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        class="flex items-start gap-3 p-3 min-w-[300px] max-w-[420px] text-sm font-mono shadow-lg border border-divider bg-elevated text-fg-primary"
      >
        <div
          class="w-0.5 self-stretch shrink-0 rounded-full"
          :class="[
            t.type === 'success'
              ? 'bg-status-success'
              : t.type === 'error'
                ? 'bg-status-error'
                : t.type === 'warning'
                  ? 'bg-status-warning'
                  : 'bg-status-info',
          ]"
        />
        <component
          :is="iconMap[t.type]"
          class="w-4 h-4 shrink-0 mt-0.5"
          :class="[
            t.type === 'success'
              ? 'text-status-success'
              : t.type === 'error'
                ? 'text-status-error'
                : t.type === 'warning'
                  ? 'text-status-warning'
                  : 'text-status-info',
          ]"
        />
        <span class="flex-1 min-w-0">{{ t.message }}</span>
        <button
          class="p-0.5 shrink-0 text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
          aria-label="Close"
          @click="remove(t.id)"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </Teleport>
</template>
