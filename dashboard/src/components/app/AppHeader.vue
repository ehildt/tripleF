<script setup lang="ts">
import { computed } from 'vue';

import type { ActiveTab } from '../../stores/app';
import { getTabBorderClass, getTabColorClass } from './AppHeader.helper';
import TabButton from './TabButton.vue';

const props = defineProps<{
  activeTab: ActiveTab;
  blinkLogo: boolean;
  debugCount: number;
  restCount?: number;
  mcpCount?: number;
  dlqCount?: number;
}>();

const emit = defineEmits<{
  (e: 'tabChange', tab: ActiveTab): void;
}>();

const activeTabColor = computed(() => getTabColorClass(props.activeTab));
const activeTabBorder = computed(() => getTabBorderClass(props.activeTab));

const tabs = computed<
  Array<{
    label: string;
    tab: ActiveTab;
    count?: number;
    activeClasses: string;
    hoverClasses: string;
  }>
>(() => [
  {
    label: '> REST_',
    tab: 'rest',
    count: props.restCount,
    activeClasses: 'bg-tab-rest',
    hoverClasses: 'hover-text-tab-rest',
  },
  {
    label: '> MCP_',
    tab: 'mcp',
    count: props.mcpCount,
    activeClasses: 'bg-tab-mcp',
    hoverClasses: 'hover-text-tab-mcp',
  },
  {
    label: '> PPROC_',
    tab: 'preprocessing',
    activeClasses: 'bg-tab-preprocessing',
    hoverClasses: 'hover-text-tab-preprocessing',
  },
  {
    label: '> DLQ_',
    tab: 'dlq',
    count: props.dlqCount,
    activeClasses: 'bg-tab-debug',
    hoverClasses: 'hover-text-tab-debug',
  },
  {
    label: '> DEBUG_',
    tab: 'debug',
    count: props.debugCount,
    activeClasses: 'bg-tab-debug',
    hoverClasses: 'hover-text-tab-debug',
  },
]);
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 border-b border-divider bg-secondary z-40"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <!-- Brand -->
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-none bg-transparent border-2 flex items-center justify-center transition-colors duration-300"
            :class="activeTabBorder"
          >
            <span
              class="font-mono font-bold text-lg transition-colors duration-300"
              :class="[
                activeTabColor,
                blinkLogo ? 'animate-blink-3' : 'animate-blink-stop',
              ]"
              >V</span
            >
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-wider font-mono">
              <span class="text-tab-rest">ckir.io</span>
              <span class="text-fg-muted">/</span>
              <span class="text-tab-rest">visions</span>
              <span
                class="transition-colors duration-300"
                :class="activeTabColor"
                >_</span
              >
            </h1>
            <p class="text-xs text-fg-muted font-mono">
              AI Vision Testing Console
            </p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-0 border border-divider">
          <TabButton
            v-for="t in tabs"
            :key="t.tab"
            :label="t.label"
            :tab="t.tab"
            :active-tab="activeTab"
            :count="t.count"
            :active-classes="t.activeClasses"
            :hover-classes="t.hoverClasses"
            :class="t.tab !== 'rest' ? 'border-l border-divider' : ''"
            @click="emit('tabChange', t.tab)"
          />
        </div>
      </div>
    </div>
  </header>
</template>
