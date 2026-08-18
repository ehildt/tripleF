<script setup lang="ts">
import {
  BrainCircuit,
  CircleGauge,
  Globe,
  GlobeOff,
  GlobeX,
  Upload,
} from '@lucide/vue';

import Dropdown from '../../../shared/ui/drop-down/DropDown.vue';
import IconButton from '../../../shared/ui/icon-button/IconButton.vue';
import MotionIcon from '../../../shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '../../../shared/ui/tooltip/Tooltip.vue';
import type { PromptActionsProps } from './PromptActions.types';

const props = defineProps<PromptActionsProps>();

const emit = defineEmits<{
  selectThink: [think: string];
  openThink: [];
  selectContextSize: [ctx: string];
  openContextSize: [];
  fileSelect: [];
  toggleSearchEngine: [];
  fileButtonMouseEnter: [];
  fileButtonMouseLeave: [];
}>();
</script>

<template>
  <div :ref="props.setActionBarRef" :class="props.actionsClass">
    <Dropdown
      :ref="props.setThinkDropdownRef"
      variant="icon-only"
      align="center"
      :label="$t('common.thinkLevel')"
      :options="props.thinkOptions"
      :model-value="props.thinkValue"
      :disabled="props.isDisabled"
      @update:model-value="emit('selectThink', $event)"
      @open="emit('openThink')"
    >
      <MotionIcon>
        <BrainCircuit class="prompt-actions__icon" />
      </MotionIcon>
    </Dropdown>
    <Dropdown
      :ref="props.setContextSizeDropdownRef"
      variant="icon-only"
      align="center"
      :label="$t('common.context')"
      :options="props.contextSizeOptions"
      :model-value="props.contextSizeValue"
      :disabled="props.isDisabled"
      :format-value="props.formatContextSize"
      @update:model-value="emit('selectContextSize', $event)"
      @open="emit('openContextSize')"
    >
      <MotionIcon>
        <CircleGauge class="prompt-actions__icon" />
      </MotionIcon>
    </Dropdown>
    <IconButton
      :title="props.fileSelectTitle"
      :disabled="props.isFileSelectDisabled"
      @mouseenter="emit('fileButtonMouseEnter')"
      @mouseleave="emit('fileButtonMouseLeave')"
      @click="emit('fileSelect')"
    >
      <Upload />
    </IconButton>
    <IconButton
      v-if="
        props.searchEngineState === 'enabled' ||
        props.searchEngineState === 'disabled'
      "
      :title="props.searchEngineToggleTitle"
      @click="emit('toggleSearchEngine')"
    >
      <Globe v-if="props.searchEngineState === 'enabled'" />
      <GlobeX v-else />
    </IconButton>
    <Tooltip
      v-else-if="props.searchEngineState === 'unavailable'"
      :text="props.noSearchEngineTitle"
    >
      <span
        class="prompt-actions__offline-indicator"
        role="img"
        :aria-label="$t('common.noSearchEngineConnected')"
      >
        <GlobeOff class="prompt-actions__icon" />
      </span>
    </Tooltip>
  </div>
</template>

<style scoped>
.prompt-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-1-5);
  align-self: center;
}

.prompt-actions--with-indicator {
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
}

.prompt-actions__offline-indicator {
  display: flex;
  align-items: center;
  padding: var(--spacing-1);
  color: var(--color-status-warning);
  cursor: help;
}

.prompt-actions__icon {
  width: 1rem;
  height: 1rem;
}
</style>
