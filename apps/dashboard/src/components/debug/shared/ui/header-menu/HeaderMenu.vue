<script lang="ts" setup>
import {
  CirclePause,
  CirclePlay,
  Mail,
  MailOpen,
  Search,
  Trash2,
} from '@lucide/vue';
import { ref } from 'vue';

import { useDebugStore } from '../../../../../stores/debug';
import FilterMenu from '../../../../shared/ui/filter-menu/FilterMenu.vue';
import IconButton from '../../../../shared/ui/icon-button/IconButton.vue';
import {
  type HeaderMenuEmits,
  useHeaderMenu,
} from './composables/use-header-menu.composable';
import type { HeaderMenuProps } from './HeaderMenu.types';

const props = defineProps<HeaderMenuProps>();

const emit = defineEmits<HeaderMenuEmits>();

const debugStore = useDebugStore();

const headerRef = ref<HTMLElement | null>(null);

const {
  isSearchOpen,
  disableAll,
  disableHttp,
  disableSocket,
  clearArmed,
  handleClearClick,
} = useHeaderMenu(props, emit, headerRef);
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
        {{ $t('common.all') }}
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
