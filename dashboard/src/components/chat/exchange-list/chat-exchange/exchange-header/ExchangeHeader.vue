<script setup lang="ts">
/**
 * Orchestrates the exchange header. Assistant exchanges keep their header:
 * role icon, copy action, response meta-bar pills, retry on error, and the
 * pending/streaming activity label + cancel action. User exchanges carry no
 * header actions (those live on the right-panel history items); their header
 * is the meta row — an AI icon on the far left with the request id, model,
 * and formatted time right-aligned. Sub-components render the details;
 * composables own the state.
 */
import { Bot, CircleX, Copy, RefreshCw } from '@lucide/vue';
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAppStore } from '@/stores/app';
import type { Exchange } from '@/stores/conversation';
import { formatTime } from '@/utils/format-time.helper';

import ResponseMetaBarPill from '../exchange-content/assistant-response/shared/ui/response-meta-bar/response-meta-bar-pill/ResponseMetaBarPill.vue';
import ResponseMetaBar from '../exchange-content/assistant-response/shared/ui/response-meta-bar/ResponseMetaBar.vue';
import { useActivityLabel } from './composables/use-activity-label';
import ExchangeActivityLabel from './exchange-activity-label/ExchangeActivityLabel.vue';
import ExchangeHeaderAction from './exchange-header-action/ExchangeHeaderAction.vue';
import ExchangeMergeTags from './exchange-merge-tags/ExchangeMergeTags.vue';
import ExchangeMetaRow from './exchange-meta-row/ExchangeMetaRow.vue';
import { buildExchangeMetaPills } from './helpers/build-exchange-meta-pills.helper';
import WorkingIndicator from './working-indicator/WorkingIndicator.vue';

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
  cancel: [requestId: string];
}>();

const { locale } = useI18n();
const appStore = useAppStore();

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

const time = computed(() => formatTime(props.exchange.timestamp, locale.value));

function onCancel() {
  if (props.exchange.requestId) {
    emit('cancel', props.exchange.requestId);
  }
}
</script>

<template>
  <!-- Assistant: role icon, copy, response meta-bar pills, retry on error,
       and the pending/streaming activity label + cancel action. -->
  <div v-if="!isUser" class="exchange-header">
    <Bot class="exchange-header__bot-icon" />

    <ExchangeHeaderAction
      v-if="isDone && appStore.chatIconVisibility.copy"
      :title="$t('common.copy')"
      @click="emit('copy')"
    >
      <Copy />
    </ExchangeHeaderAction>

    <ResponseMetaBar
      v-if="isDone && metaPills.length"
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
      :title="$t('common.retry')"
      variant="error"
      @click="emit('retry')"
    >
      <RefreshCw />
    </ExchangeHeaderAction>

    <ExchangeHeaderAction
      v-if="isLive && exchange.requestId"
      :title="$t('common.cancel')"
      @click="onCancel"
    >
      <CircleX />
    </ExchangeHeaderAction>
    <WorkingIndicator v-if="isLive" class="exchange-header__working" />
    <ExchangeActivityLabel
      v-if="isLive && activityLabel"
      :label="activityLabel"
    />
  </div>

  <!-- User: no header actions (they live on the right-panel history items),
       so the meta row is the header. -->
  <ExchangeMetaRow
    v-else
    :request-id="exchange.requestId"
    :model="exchange.model"
    :time="time"
  />
  <ExchangeMergeTags
    v-if="isUser && exchange.mergeOrigin?.length"
    :request-ids="exchange.mergeOrigin"
  />
</template>

<style scoped>
.exchange-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-1);
}

.exchange-header__bot-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--color-tab-rest);
}

.exchange-header__meta-bar {
  min-width: 0;
  overflow: hidden;
}

.exchange-header__meta-bar :deep(.pill) {
  font-size: 0.675rem;
}
</style>
