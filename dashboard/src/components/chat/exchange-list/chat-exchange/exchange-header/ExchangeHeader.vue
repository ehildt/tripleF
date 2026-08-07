<script setup lang="ts">
/**
 * Orchestrates the exchange header: role icon, conditional action buttons,
 * context percentage (user), and the pending activity label + cancel action
 * (assistant). Sub-components render the details; composables own the state.
 */
import {
  Bot,
  Copy,
  GitBranch,
  RefreshCw,
  SendToBack,
  Trash2,
  User,
  X,
} from '@lucide/vue';
import { computed, toRef } from 'vue';

import type { Exchange } from '@/stores/conversation';

import ResponseMetaBarPill from '../exchange-content/assistant-response/shared/ui/response-meta-bar/response-meta-bar-pill/ResponseMetaBarPill.vue';
import ResponseMetaBar from '../exchange-content/assistant-response/shared/ui/response-meta-bar/ResponseMetaBar.vue';
import { formatExchangeTime } from '../helpers/format-exchange-time.helper';
import { useActivityLabel } from './composables/use-activity-label';
import { usePromptContextPercent } from './composables/use-prompt-context-percent';
import ExchangeActivityLabel from './exchange-activity-label/ExchangeActivityLabel.vue';
import ExchangeHeaderAction from './exchange-header-action/ExchangeHeaderAction.vue';
import ExchangeMetaRow from './exchange-meta-row/ExchangeMetaRow.vue';
import { buildExchangeMetaPills } from './helpers/build-exchange-meta-pills.helper';

const props = defineProps<{
  exchange: Exchange;
  isUser: boolean;
  isDone: boolean;
  isError: boolean;
  isPending: boolean;
  isStreaming: boolean;
}>();

const emit = defineEmits<{
  copy: [];
  retry: [];
  branch: [];
  delete: [];
  toggleIncluded: [];
  cancel: [requestId: string];
  hoverDeleteStart: [];
  hoverDeleteEnd: [];
}>();

const { activityLabel } = useActivityLabel(toRef(props, 'exchange'));

/** Assistant meta-bar pills (category/date/read-time/author) from the
 *  parsed response, shown after the copy action. */
const metaPills = computed(() =>
  buildExchangeMetaPills(props.exchange.harnessData),
);

/**
 * The exchange is live while pending (pipeline steps, thinking) and while
 * streaming (assembling the response): the activity label and the cancel
 * action stay up for the whole lifecycle and only die with the done event.
 */
const isLive = computed(() => props.isPending || props.isStreaming);
const { promptContextPercent } = usePromptContextPercent(
  toRef(props, 'exchange'),
  toRef(props, 'isUser'),
);

const time = computed(() => formatExchangeTime(props.exchange.timestamp));

function onCancel() {
  if (props.exchange.requestId) {
    emit('cancel', props.exchange.requestId);
  }
}
</script>

<template>
  <div class="exchange-header" :class="isUser ? 'exchange-header--user' : ''">
    <Bot v-if="!isUser" class="exchange-header__bot-icon" />
    <User v-else class="exchange-header__user-icon" />

    <ExchangeHeaderAction v-if="isDone" title="Copy" @click="emit('copy')">
      <Copy />
    </ExchangeHeaderAction>

    <ResponseMetaBar
      v-if="!isUser && isDone && metaPills.length"
      class="exchange-header__meta-bar"
    >
      <ResponseMetaBarPill
        v-for="pill in metaPills"
        :key="pill.text"
        :variant="pill.variant"
        >{{ pill.text }}</ResponseMetaBarPill
      >
    </ResponseMetaBar>
    <ExchangeHeaderAction
      v-if="isError"
      title="Retry"
      variant="error"
      @click="emit('retry')"
    >
      <RefreshCw />
    </ExchangeHeaderAction>
    <ExchangeHeaderAction
      v-if="isUser"
      title="Toggle context inclusion"
      :active="exchange.included === false"
      @click="emit('toggleIncluded')"
    >
      <SendToBack />
    </ExchangeHeaderAction>
    <ExchangeHeaderAction v-if="isUser" title="Branch" @click="emit('branch')">
      <GitBranch />
    </ExchangeHeaderAction>
    <ExchangeHeaderAction
      v-if="isUser"
      title="Delete"
      variant="danger"
      @click="emit('delete')"
      @hover-start="emit('hoverDeleteStart')"
      @hover-end="emit('hoverDeleteEnd')"
    >
      <Trash2 />
    </ExchangeHeaderAction>

    <span
      v-if="isUser && promptContextPercent != null"
      class="exchange-header__meta"
      title="Context window used by this prompt + response"
    >
      {{ promptContextPercent }}%
    </span>

    <ExchangeHeaderAction
      v-if="isLive && exchange.requestId"
      title="Cancel"
      @click="onCancel"
    >
      <X />
    </ExchangeHeaderAction>
    <ExchangeActivityLabel
      v-if="!isUser && isLive && activityLabel"
      :label="activityLabel"
    />
  </div>
  <ExchangeMetaRow
    v-if="isUser"
    :request-id="exchange.requestId"
    :model="exchange.model"
    :time="time"
  />
</template>

<style scoped>
.exchange-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-1);
}

.exchange-header--user {
  flex-direction: row-reverse;
}

.exchange-header__bot-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--color-tab-rest);
}

.exchange-header__user-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--color-tab-accent);
}

.exchange-header__meta {
  font-size: 0.75rem;
  color: var(--color-fg-muted);
  font-family: var(--font-mono);
}

.exchange-header__meta-bar {
  min-width: 0;
  overflow: hidden;
}

.exchange-header__meta-bar :deep(.pill) {
  font-size: 0.675rem;
}
</style>
