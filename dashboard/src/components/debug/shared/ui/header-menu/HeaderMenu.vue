<script lang="ts" setup>
import {
  CirclePause,
  CirclePlay,
  Mail,
  MailOpen,
  Search,
  Trash2,
} from '@lucide/vue';
import { computed, onUnmounted, ref } from 'vue';

import { useDebugStore } from '../../../../../stores/debug';
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
  <div class="header-menu">
    <label class="header-menu__search">
      <Search class="header-menu__search-icon" />
      <input
        :value="search"
        class="header-menu__search-input"
        placeholder="filter…"
        aria-label="Filter requests"
        @input="
          emit('update:search', ($event.target as HTMLInputElement).value)
        "
      />
    </label>

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

    <button
      class="header-menu__icon-button"
      :class="{ 'header-menu__icon-button--active': hideRead }"
      :title="hideRead ? 'Show read requests' : 'Hide read requests'"
      @click="emit('update:hideRead', !hideRead)"
    >
      <Mail v-if="hideRead" class="header-menu__icon" />
      <MailOpen v-else class="header-menu__icon" />
    </button>

    <button
      class="header-menu__icon-button"
      :class="{ 'header-menu__icon-button--active': debugStore.debugPaused }"
      :title="debugStore.debugPaused ? 'Resume logging' : 'Pause logging'"
      @click="debugStore.toggleDebugPaused()"
    >
      <CirclePause v-if="!debugStore.debugPaused" class="header-menu__icon" />
      <CirclePlay v-else class="header-menu__icon" />
    </button>

    <button
      :disabled="disableAll"
      class="header-menu__icon-button header-menu__icon-button--danger"
      :class="{ 'header-menu__icon-button--armed': clearArmed }"
      :title="clearArmed ? 'Click again to clear the log' : 'Clear the log'"
      @click="handleClearClick"
    >
      <Trash2 class="header-menu__icon" />
    </button>
  </div>
</template>

<style scoped>
.header-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

/* Inline filter search — borderless like our other field controls */
.header-menu__search {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  min-width: 0;
  color: var(--color-fg-muted);
}

.header-menu__search-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.header-menu__search-input {
  width: 8rem;
  min-width: 0;
  border: none;
  background: transparent;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-primary);
  outline: none;
}

.header-menu__search-input::placeholder {
  color: var(--color-fg-muted);
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

.header-menu__icon-button {
  display: flex;
  align-items: center;
  padding: var(--spacing-1);
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.header-menu__icon-button:hover:not(:disabled) {
  color: var(--color-fg-primary);
}

.header-menu__icon-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.header-menu__icon-button--active,
.header-menu__icon-button--active:hover:not(:disabled) {
  color: var(--color-accent-primary);
}

.header-menu__icon-button--danger:hover:not(:disabled) {
  color: var(--color-status-error);
}

.header-menu__icon-button--armed,
.header-menu__icon-button--armed:hover:not(:disabled) {
  color: var(--color-status-error);
  background-color: color-mix(
    in srgb,
    var(--color-status-error) 20%,
    transparent
  );
  animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.header-menu__icon {
  width: 1rem;
  height: 1rem;
}
</style>
