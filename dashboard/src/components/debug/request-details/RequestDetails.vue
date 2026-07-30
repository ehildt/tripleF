<script setup lang="ts">
import { Brain, Clock, Cpu, Link2 } from '@lucide/vue';
import { computed } from 'vue';

import type { DebugResult } from '../../../types/debug.model';
import ExpandableMessageList from '../../shared/ui/expandable-message-list/ExpandableMessageList.vue';
import PanelEmptyState from '../../shared/ui/panel-empty-state/PanelEmptyState.vue';
import PanelHeader from '../../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '../../shared/ui/panel-layout/PanelLayout.vue';
import TabPanel from '../../shared/ui/tab-panel/TabPanel.vue';
import { useRequestDetails } from './composables/use-request-details';
import DetailTag from './detail-tag/DetailTag.vue';
import { formatSize } from './helpers/format-size.helper';
import { formatTotalDuration } from './helpers/format-total-duration.helper';

const props = defineProps<{
  result: DebugResult | null;
}>();

const resultRef = computed(() => props.result);
const {
  parsedEndpoint,
  tokenPercent,
  tabs,
  activeTab,
  activeContent,
  selectTab,
  copyActive,
  isCopied,
} = useRequestDetails(resultRef);
</script>

<template>
  <PanelLayout>
    <PanelHeader>
      <PanelHeaderTitle label="Request Details" />
    </PanelHeader>

    <div v-if="result" :key="result.id" class="request-details">
      <!-- Property Table -->
      <div class="request-details__grid">
        <!-- URL (HTTP) -->
        <template v-if="result.type !== 'socket' && parsedEndpoint.path">
          <span class="request-details__label"><Link2 />URL</span>
          <div class="request-details__tags">
            <DetailTag field="endpoint" :value="parsedEndpoint.path" />
          </div>
        </template>

        <!-- Socket URL + Event + Room -->
        <template v-if="result.type === 'socket'">
          <span class="request-details__label"><Link2 />URL</span>
          <div class="request-details__tags">
            <DetailTag field="endpoint" :value="parsedEndpoint.path" />
            <DetailTag
              v-if="parsedEndpoint.event"
              field="event"
              :value="parsedEndpoint.event"
            />
            <DetailTag
              v-if="parsedEndpoint.room"
              field="roomId"
              :value="parsedEndpoint.room"
            />
          </div>
        </template>

        <!-- Tokens -->
        <template
          v-if="
            result.model ||
            result.numCtx ||
            result.stream !== undefined ||
            result.preprocessing ||
            result.promptEvalCount != null
          "
        >
          <span class="request-details__label"><Cpu />Tokens</span>
          <div class="request-details__tags">
            <DetailTag
              v-if="result.promptEvalCount != null"
              field="promptEvalCount"
              :value="result.promptEvalCount"
            />
            <DetailTag
              v-if="result.evalCount != null"
              field="evalCount"
              :value="result.evalCount"
            />
            <DetailTag field="numCtx" :value="result.numCtx" />
            <DetailTag
              v-if="tokenPercent != null"
              field="tokenPercent"
              :value="`${tokenPercent}%`"
            />
          </div>
        </template>

        <!-- Timing -->
        <span class="request-details__label"><Clock />Timing</span>
        <div class="request-details__tags">
          <DetailTag
            field="responseTime"
            :value="result.responseTime > 0 ? `${result.responseTime}ms` : ''"
          />
          <DetailTag field="statusCode" :value="result.statusCode" />
          <DetailTag field="summarySize" :value="formatSize(result)" />
          <DetailTag
            v-if="result.totalDuration"
            field="totalDuration"
            :value="formatTotalDuration(result.totalDuration)"
          />
        </div>

        <!-- Channels (socket only) -->
        <template
          v-if="
            result.type === 'socket' &&
            (result.event || result.roomId || result.conversationId)
          "
        >
          <span class="request-details__label">Channels</span>
          <div class="request-details__tags">
            <DetailTag field="event" :value="result.event" />
            <DetailTag field="roomId" :value="result.roomId" />
            <DetailTag field="conversationId" :value="result.conversationId" />
          </div>
        </template>

        <!-- Model -->
        <template
          v-if="
            result.model || result.stream !== undefined || result.preprocessing
          "
        >
          <span class="request-details__label"><Brain />Model</span>
          <div class="request-details__tags">
            <DetailTag field="model" :value="result.model" />
            <DetailTag field="stream" :value="result.stream" />
            <DetailTag field="preprocessing" :value="result.preprocessing" />
          </div>
        </template>
      </div>

      <!-- Tab Panel -->
      <TabPanel
        :tabs="tabs"
        :active-tab="activeTab"
        :copyable="
          activeTab !== 'prompt' && activeTab !== 'error' && activeTab !== null
        "
        :copied="isCopied"
        @select="selectTab"
        @copy="copyActive"
      >
        <template v-if="activeTab === 'error'">
          <div class="request-details__error">
            <pre class="request-details__error-body">{{
              activeContent?.content
            }}</pre>
          </div>
        </template>
        <template v-else-if="activeTab === 'prompt'">
          <div class="request-details__prompt">
            <ExpandableMessageList :items="activeContent?.content as any" />
          </div>
        </template>
        <template v-else>
          <pre class="request-details__content">{{
            activeContent?.content
          }}</pre>
        </template>
      </TabPanel>
    </div>

    <PanelEmptyState v-else />
  </PanelLayout>
</template>

<style scoped>
.request-details {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--spacing-4);
  min-height: 0;
  padding: var(--spacing-4);
}

.request-details__grid {
  display: grid;
  grid-template-columns: 54px 1fr;
  column-gap: var(--spacing-2);
  row-gap: var(--spacing-1-5);
}

.request-details__label {
  display: flex;
  align-items: center;
  height: 100%;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-fg-muted);
}

.request-details__label svg {
  width: 0.75rem;
  height: 0.75rem;
  margin-right: var(--spacing-1);
}

.request-details__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  width: 100%;
}

.request-details__error {
  padding: var(--spacing-3);
}

.request-details__error-body {
  margin: 0;
  padding: var(--spacing-2);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  color: var(--color-status-error);
  background-color: color-mix(
    in srgb,
    var(--color-status-error) 5%,
    transparent
  );
  border: 1px solid
    color-mix(in srgb, var(--color-status-error) 20%, transparent);
}

.request-details__prompt {
  padding: var(--spacing-2);
  padding-right: var(--spacing-8);
}

.request-details__content {
  margin: 0;
  padding: var(--spacing-2);
  padding-right: var(--spacing-8);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
</style>
