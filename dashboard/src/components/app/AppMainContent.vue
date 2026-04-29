<script setup lang="ts">
import EventLog from '../../components/event-log/EventLog.vue';
import DebugPanelDetails from '../../panels/debug/DebugPanel.Details.vue';
import DebugPanelHealth from '../../panels/debug/DebugPanel.Health.vue';
import DebugPanel from '../../panels/debug/DebugPanel.vue';
import DlqPanel from '../../panels/dlq/DlqPanel.vue';
import McpPanel from '../../panels/mcp/McpPanel.vue';
import PreprocessingPanelOptionsPanel from '../../panels/preprocessing/PreprocessingPanel.OptionsPanel.vue';
import PreprocessingPanelToolsPanel from '../../panels/preprocessing/PreprocessingPanel.ToolsPanel.vue';
import RestPanel from '../../panels/rest/RestPanel.vue';
import type { SocketProvider } from '../../types/socket-provider.model';

defineProps<{
  activeTab: string;
  restSocketProvider: SocketProvider;
  mcpSocketProvider: SocketProvider;
  models: string[];
  modelsLoading: boolean;
  connectionState: 'connected' | 'disconnected' | 'error';
  restMessages: Array<{ time: string; event: string; data: unknown }>;
  mcpMessages: Array<{ time: string; event: string; data: unknown }>;
  debugResults: any[];
  selectedDebugResult: any | null;
}>();

const emit = defineEmits<{
  refreshModels: [];
  modelSelected: [];
  clearRestMessages: [];
  clearMcpMessages: [];
  clearRestIndex: [index: number];
  clearMcpIndex: [index: number];
  abort: [requestId: string];
  copy: [text: string, index: number];
  clearDebugResults: [];
  selectDebugResult: [result: any];
}>();
</script>

<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- DLQ Tab -->
      <template v-if="activeTab === 'dlq'">
        <DlqPanel class="lg:col-span-2" :models="models" />
      </template>

      <!-- Debug Tab -->
      <template v-else-if="activeTab === 'debug'">
        <DebugPanelHealth class="lg:col-span-2" />
        <DebugPanel
          :results="debugResults"
          :selected-result="selectedDebugResult"
          @clear="emit('clearDebugResults')"
          @select="emit('selectDebugResult', $event)"
        />
        <DebugPanelDetails :result="selectedDebugResult" />
      </template>

      <!-- Other tabs -->
      <template v-else>
        <div class="h-fit lg:sticky lg:top-24">
          <RestPanel
            v-if="activeTab === 'rest'"
            :socket-provider="restSocketProvider"
            :models="models"
            :models-loading="modelsLoading"
            :connection-state="connectionState"
            @refresh-models="emit('refreshModels')"
            @model-selected="emit('modelSelected')"
          />
          <McpPanel
            v-else-if="activeTab === 'mcp'"
            :socket-provider="mcpSocketProvider"
            :models="models"
            :models-loading="modelsLoading"
            :connection-state="connectionState"
            @refresh-models="emit('refreshModels')"
            @model-selected="emit('modelSelected')"
          />
          <PreprocessingPanelToolsPanel
            v-else-if="activeTab === 'preprocessing'"
          />
        </div>

        <div class="h-full">
          <!-- REST Event Log -->
          <EventLog
            v-if="activeTab === 'rest'"
            :messages="restMessages"
            @clear="emit('clearRestMessages')"
            @clear-index="emit('clearRestIndex', $event)"
            @abort="emit('abort', $event)"
            @copy="(text: string, idx: number) => emit('copy', text, idx)"
          />
          <!-- MCP Event Log -->
          <EventLog
            v-else-if="activeTab === 'mcp'"
            :messages="mcpMessages"
            @clear="emit('clearMcpMessages')"
            @clear-index="emit('clearMcpIndex', $event)"
            @abort="emit('abort', $event)"
            @copy="(text: string, idx: number) => emit('copy', text, idx)"
          />
          <PreprocessingPanelOptionsPanel
            v-else-if="activeTab === 'preprocessing'"
            class="h-full lg:sticky lg:top-24"
          />
        </div>
      </template>
    </div>
  </main>
</template>
