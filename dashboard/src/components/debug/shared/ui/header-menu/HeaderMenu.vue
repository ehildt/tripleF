<script lang="ts" setup>
import {
  CirclePause,
  CirclePlay,
  Mail,
  MailOpen,
  Search,
  Trash2,
} from '@lucide/vue';
import { onClickOutside } from '@vueuse/core';
import { computed, onUnmounted, ref } from 'vue';

import { useDebugStore } from '../../../../../stores/debug';
import FilterMenu from '../../../../shared/ui/filter-menu/FilterMenu.vue';
import IconButton from '../../../../shared/ui/icon-button/IconButton.vue';
import type { DebugResultFilter } from '../../../helpers/build-filtered-debug-results.helper';

const props = defineProps<{
  filter: DebugResultFilter;
  search: string;
  allCount: number;
  httpCount: number;
  socketCount: number;
  hideRead?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:filter', value: DebugResultFilter): void;
  (e: 'update:search', value: string): void;
  (e: 'update:hideRead', value: boolean): void;
  (e: 'clear'): void;
}>();

const debugStore = useDebugStore();

const headerRef = ref<HTMLElement | null>(null);
const isSearchOpen = ref(false);

onClickOutside(headerRef, () => {
  isSearchOpen.value = false;
});

const disableAll = computed(() => props.allCount === 0);
const disableHttp = computed(() => props.httpCount === 0);
const disableSocket = computed(() => props.socketCount === 0);

/** Clear wipes the whole log — arm first, second click within 3 s executes. */
const clearArmed = ref(false);
let clearArmTimer: ReturnType<typeof setTimeout> | null = null;

function handleClearClick() {
  if (clearArmed.value) {
    disarmClear();
    emit('clear');
    return;
  }
  clearArmed.value = true;
  clearArmTimer = setTimeout(() => {
    clearArmed.value = false;
  }, 3000);
}

function disarmClear() {
  clearArmed.value = false;
  if (clearArmTimer) clearTimeout(clearArmTimer);
  clearArmTimer = null;
}

onUnmounted(disarmClear);
</script>

<template>
  <div ref="headerRef" class="header-menu">
    <div class="header-menu__filters">
      <button
        :disabled="disableAll"
        class="header-menu__filter"
        :class="{ 'header-menu__filter--all': filter === 'all' }"
        @click="emit('update:filter', 'all')"
      >
        ALL
      </button>
      <button
        :disabled="disableHttp"
        class="header-menu__filter"
        :class="{ 'header-menu__filter--http': filter === 'http' }"
        @click="emit('update:filter', 'http')"
      >
        HTTP
      </button>
      <button
        :disabled="disableSocket"
        class="header-menu__filter"
        :class="{ 'header-menu__filter--socket': filter === 'socket' }"
        @click="emit('update:filter', 'socket')"
      >
        SOCKET
      </button>
    </div>

    <FilterMenu
      :is-open="isSearchOpen"
      :is-active="search !== ''"
      :title="$t('common.search')"
      width="16rem"
      :options="[]"
      :selected-value="search"
      has-text-value
      @toggle="isSearchOpen = !isSearchOpen"
      @select="emit('update:search', $event)"
    >
      <Search />
    </FilterMenu>

    <IconButton
      :active="hideRead"
      :title="
        hideRead ? $t('common.showReadRequests') : $t('common.hideReadRequests')
      "
      @click="emit('update:hideRead', !hideRead)"
    >
      <Mail v-if="hideRead" />
      <MailOpen v-else />
    </IconButton>

    <IconButton
      :active="debugStore.debugPaused"
      :title="
        debugStore.debugPaused
          ? $t('common.resumeLogging')
          : $t('common.pauseLogging')
      "
      @click="debugStore.toggleDebugPaused()"
    >
      <CirclePause v-if="!debugStore.debugPaused" />
      <CirclePlay v-else />
    </IconButton>

    <IconButton
      :disabled="disableAll"
      danger
      :armed="clearArmed"
      :title="
        clearArmed ? $t('common.clickAgainClearLog') : $t('common.clearLog')
      "
      @click="handleClearClick"
    >
      <Trash2 />
    </IconButton>
  </div>
</template>

<style scoped>
.header-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.header-menu__filters {
  display: flex;
  align-items: center;
}

.header-menu__filter {
  padding: var(--spacing-1) var(--spacing-3);
  border: 1px solid var(--color-divider);
  margin-left: -1px;
  background: none;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.header-menu__filter:first-child {
  margin-left: 0;
}

.header-menu__filter:hover:not(:disabled) {
  background-color: var(--color-bg-secondary);
}

.header-menu__filter:disabled {
  opacity: 0.5;
  cursor: default;
}

.header-menu__filter--all,
.header-menu__filter--http,
.header-menu__filter--socket {
  font-weight: 700;
  color: var(--color-fg-inverse);
}

.header-menu__filter--all {
  background-color: var(--color-tab-rest);
}

.header-menu__filter--http {
  background-color: var(--color-tab-accent);
}

.header-menu__filter--socket {
  background-color: color-mix(
    in srgb,
    var(--color-tab-rest) 50%,
    var(--color-tab-accent)
  );
}
</style>
