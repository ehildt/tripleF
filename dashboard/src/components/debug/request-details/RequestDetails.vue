<script setup lang="ts">
import { Brain, Clock, Copy, Cpu, Link2 } from '@lucide/vue';
import { computed } from 'vue';

import type { DebugResult } from '../../../types/debug.model';
import ExpandableMessageList from '../../shared/ui/expandable-message-list/ExpandableMessageList.vue';
import PanelEmptyState from '../../shared/ui/panel-empty-state/PanelEmptyState.vue';
import PanelHeader from '../../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '../../shared/ui/panel-layout/PanelLayout.vue';
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

      <!-- Tab Menu -->
      <div v-if="tabs.length" class="request-details__tabs-container">
        <div class="request-details__tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="request-details__tab"
            :class="{ 'request-details__tab--active': activeTab === tab.id }"
            @click="selectTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Content Area -->
        <div v-if="activeContent" class="request-details__panel">
          <template v-if="activeTab === 'error'">
            <div class="request-details__error">
              <pre class="request-details__error-body">{{
                activeContent.content
              }}</pre>
            </div>
          </template>
          <template v-else-if="activeTab === 'prompt'">
            <div class="request-details__prompt">
              <ExpandableMessageList :items="activeContent.content as any" />
            </div>
          </template>
          <template v-else>
            <button
              class="request-details__copy"
              :class="{ 'request-details__copy--copied': isCopied }"
              :title="isCopied ? 'Copied!' : 'Copy'"
              @click="copyActive"
            >
              <Copy class="request-details__copy-icon" />
            </button>
            <pre class="request-details__content">{{
              activeContent.content
            }}</pre>
          </template>
        </div>
        <div v-else class="request-details__no-tab">
          <span>Select a tab to view content</span>
        </div>
      </div>
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

.request-details__tabs-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  border-top: 1px solid var(--color-divider);
  padding-top: var(--spacing-3);
}

.request-details__tab-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-0-5);
  margin-bottom: -1px;
  position: relative;
  z-index: 10;
}

.request-details__tab {
  flex: 1;
  padding: var(--spacing-1-5) var(--spacing-3);
  border: none;
  background: none;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.request-details__tab:hover {
  color: var(--color-fg-secondary);
}

.request-details__tab--active {
  border: 1px solid var(--color-divider);
  border-bottom: 0;
  background-color: var(--color-bg-secondary);
  color: var(--color-accent-primary);
}

/* Fills the space under the tab bar and scrolls internally — the column
   wrapper in DebugSection owns the shared panel height. */
.request-details__panel {
  position: relative;
  flex: 1;
  min-height: 0;
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-secondary);
  overflow-y: auto;
  overscroll-behavior: contain;
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

.request-details__copy {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  z-index: 10;
  padding: var(--spacing-1);
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.request-details__copy:hover {
  color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
}

.request-details__copy--copied {
  color: var(--color-accent-primary);
}

.request-details__copy-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.request-details__no-tab {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
}
</style>
