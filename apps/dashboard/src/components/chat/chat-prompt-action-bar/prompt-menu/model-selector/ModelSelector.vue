<script setup lang="ts">
import { Brain } from '@lucide/vue';

import ToolbarMenuTrigger from '@/components/chat/chat-prompt-action-bar/prompt-menu/shared/ui/toolbar-menu-trigger/ToolbarMenuTrigger.vue';
import ModelList from '@/components/shared/ui/model-list/ModelList.vue';

import type { ModelSelectorProps } from './ModelSelector.types';

defineProps<ModelSelectorProps>();

const emit = defineEmits<{
  toggleMenu: [];
  selectModel: [modelName: string];
  close: [];
}>();
</script>

<template>
  <!-- The trigger shares the strip's ToolbarMenuTrigger: same ghost-icon
       look, same above-the-bar anchoring, same backdrop close. -->
  <ToolbarMenuTrigger
    :is-open="isOpen"
    :title="$t('common.selectModel')"
    :trigger-icon="Brain"
    @toggle-menu="emit('toggleMenu')"
    @close="emit('close')"
  >
    <ModelList
      :local-models="localModels"
      :cloud-models="cloudModels"
      :selected-model="selectedModelName"
      :loading="isLoading"
      @select="emit('selectModel', $event)"
    />
  </ToolbarMenuTrigger>
</template>
