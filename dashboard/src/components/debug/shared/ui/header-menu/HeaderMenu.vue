<script lang="ts" setup>
import { CirclePause, CirclePlay, Eye, EyeOff, Trash2 } from '@lucide/vue';
import { computed } from 'vue';

import { useDebugStore } from '../../../../../stores/debug';

const props = defineProps<{
  filter: 'all' | 'http' | 'socket';
  allCount: number;
  httpCount: number;
  socketCount: number;
  hideRead?: boolean;
}>();

defineEmits<{
  (e: 'update:filter', value: 'all' | 'http' | 'socket'): void;
  (e: 'clear'): void;
  (e: 'update:hideRead', value: boolean): void;
}>();

const debugStore = useDebugStore();

const disableAll = computed(() => props.allCount === 0);
const disableHttp = computed(() => props.httpCount === 0);
const disableSocket = computed(() => props.socketCount === 0);
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="flex items-center -gap-px">
      <button
        :disabled="disableAll"
        class="px-3 py-1 text-xs font-mono transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-divider"
        :class="
          filter === 'all'
            ? 'font-bold text-fg-inverse'
            : 'text-fg-secondary hover:bg-secondary'
        "
        :style="
          filter === 'all'
            ? {
                backgroundColor:
                  'color-mix(in srgb, var(--color-tab-rest) 100%, var(--color-tab-accent))',
              }
            : {}
        "
        @click="$emit('update:filter', 'all')"
      >
        ALL
      </button>
      <button
        :disabled="disableHttp"
        class="px-3 py-1 text-xs font-mono transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-divider -ml-px"
        :class="
          filter === 'http'
            ? 'font-bold text-fg-inverse'
            : 'text-fg-secondary hover:bg-secondary'
        "
        :style="
          filter === 'http'
            ? {
                backgroundColor:
                  'color-mix(in srgb, var(--color-tab-rest) 0%, var(--color-tab-accent))',
              }
            : {}
        "
        @click="$emit('update:filter', 'http')"
      >
        HTTP
      </button>
      <button
        :disabled="disableSocket"
        class="px-3 py-1 text-xs font-mono transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-divider -ml-px"
        :class="
          filter === 'socket'
            ? 'font-bold text-fg-inverse'
            : 'text-fg-secondary hover:bg-secondary'
        "
        :style="
          filter === 'socket'
            ? {
                backgroundColor:
                  'color-mix(in srgb, var(--color-tab-rest) 50%, var(--color-tab-accent))',
              }
            : {}
        "
        @click="$emit('update:filter', 'socket')"
      >
        SOCKET
      </button>
    </div>
    <button
      class="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer"
      :class="
        hideRead ? 'text-accent-primary' : 'text-fg-muted hover:text-fg-primary'
      "
      @click="$emit('update:hideRead', !hideRead)"
    >
      <Eye v-if="hideRead" class="w-4 h-4" />
      <EyeOff v-else class="w-4 h-4" />
    </button>
    <button
      class="p-1 transition-colors cursor-pointer"
      :class="
        debugStore.debugPaused
          ? 'text-accent-primary'
          : 'text-fg-muted hover:text-fg-primary'
      "
      :title="debugStore.debugPaused ? 'Resume logging' : 'Pause logging'"
      @click="debugStore.toggleDebugPaused()"
    >
      <CirclePause v-if="!debugStore.debugPaused" class="w-4 h-4" />
      <CirclePlay v-else class="w-4 h-4" />
    </button>
    <button
      :disabled="disableAll"
      class="p-1 text-fg-muted hover:text-status-error transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      @click="$emit('clear')"
    >
      <Trash2 class="w-4 h-4" />
    </button>
  </div>
</template>
