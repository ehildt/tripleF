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

    <div v-if="result" :key="result.id" class="p-4 space-y-4">
      <!-- Property Table -->
      <div class="grid grid-cols-[54px_1fr] gap-x-2 gap-y-1.5">
        <!-- URL (HTTP) -->
        <template v-if="result.type !== 'socket' && parsedEndpoint.path">
          <span
            class="text-[10px] font-mono font-bold uppercase tracking-wider text-fg-muted flex items-center h-full"
          >
            <Link2 class="w-3 h-3 mr-1" />URL
          </span>
          <div class="flex gap-1 flex-wrap w-full">
            <DetailTag field="endpoint" :value="parsedEndpoint.path" />
          </div>
        </template>

        <!-- Socket URL + Event + Room -->
        <template v-if="result.type === 'socket'">
          <span
            class="text-[10px] font-mono font-bold uppercase tracking-wider text-fg-muted flex items-center h-full"
          >
            <Link2 class="w-3 h-3 mr-1" />URL
          </span>
          <div class="flex gap-1 flex-wrap w-full">
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
          <span
            class="text-[10px] font-mono font-bold uppercase tracking-wider text-fg-muted flex items-center h-full"
          >
            <Cpu class="w-3 h-3 mr-1" />Tokens
          </span>
          <div class="flex gap-1 flex-wrap w-full">
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
        <span
          class="text-[10px] font-mono font-bold uppercase tracking-wider text-fg-muted flex items-center h-full"
        >
          <Clock class="w-3 h-3 mr-1" />Timing
        </span>
        <div class="flex gap-1 flex-wrap w-full">
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
          <span
            class="text-[10px] font-mono font-bold uppercase tracking-wider text-fg-muted flex items-center h-full"
            >Channels</span
          >
          <div class="flex gap-1 flex-wrap w-full">
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
          <span
            class="text-[10px] font-mono font-bold uppercase tracking-wider text-fg-muted flex items-center h-full"
          >
            <Brain class="w-3 h-3 mr-1" />Model
          </span>
          <div class="flex gap-1 flex-wrap w-full">
            <DetailTag field="model" :value="result.model" />
            <DetailTag field="stream" :value="result.stream" />
            <DetailTag field="preprocessing" :value="result.preprocessing" />
          </div>
        </template>
      </div>

      <!-- Tab Menu -->
      <div v-if="tabs.length" class="border-t border-divider pt-3">
        <div class="flex items-center gap-0.5 -mb-px relative z-10">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="text-[10px] font-mono font-bold uppercase px-3 py-1.5 transition-colors cursor-pointer flex-1 text-center"
            :class="
              activeTab === tab.id
                ? 'border border-divider border-b-0 bg-secondary text-accent-primary'
                : 'text-fg-muted hover:text-fg-secondary'
            "
            @click="selectTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Content Area -->
        <div
          v-if="activeContent"
          class="relative border border-divider bg-secondary max-h-107 overflow-y-auto"
        >
          <template v-if="activeTab === 'error'">
            <div class="p-3 space-y-2">
              <pre
                class="text-xs font-mono text-status-error whitespace-pre-wrap break-word bg-status-error/5 p-2 border border-status-error/20 max-h-60 overflow-y-auto"
                >{{ activeContent.content }}</pre>
            </div>
          </template>
          <template v-else-if="activeTab === 'prompt'">
            <div class="p-2 pr-8">
              <ExpandableMessageList :items="activeContent.content as any" />
            </div>
          </template>
          <template v-else>
            <button
              class="absolute right-2 top-2 z-10 p-1 text-fg-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors cursor-pointer"
              :title="isCopied ? 'Copied!' : 'Copy'"
              @click="copyActive"
            >
              <Copy
                class="w-3.5 h-3.5"
                :class="{ 'text-accent-primary': isCopied }"
              />
            </button>
            <pre
              class="text-xs font-mono whitespace-pre-wrap break-word p-2 pr-8 max-h-90 overflow-y-auto"
              >{{ activeContent.content }}</pre>
          </template>
        </div>
        <div v-else>
          <span class="text-[10px] font-mono text-fg-muted"
            >Select a tab to view content</span
          >
        </div>
      </div>
    </div>

    <PanelEmptyState v-else />
  </PanelLayout>
</template>
