<script setup lang="ts">
/**
 * Interactive, non-modal node-details popover. The canvas owns visibility,
 * positioning, and rotation pausing; this component presents metadata and the
 * complete node payload in one vertically scrollable details document.
 */
import { X } from '@lucide/vue';
import { useId } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';

import NodeDetailsContent from './node-details-content/NodeDetailsContent.vue';
import NodeDetailsMetadata from './node-details-metadata/NodeDetailsMetadata.vue';
import NodeDetailsSection from './node-details-section/NodeDetailsSection.vue';
import type {
  NodeDetailsPopoverEmits,
  NodeDetailsPopoverProps,
} from './NodeDetailsPopover.types';

defineProps<NodeDetailsPopoverProps>();
const emit = defineEmits<NodeDetailsPopoverEmits>();
const popoverId = useId();
</script>

<template>
  <div
    class="node-details-popover"
    role="dialog"
    :aria-labelledby="`${popoverId}-title`"
    :style="{ left: position.left, top: position.top }"
    tabindex="0"
    @keydown.esc.stop="emit('close')"
  >
    <header
      class="node-details-popover__header"
      @pointerdown="emit('drag', $event)"
    >
      <h3 :id="`${popoverId}-title`" class="node-details-popover__title">
        {{ label }}
      </h3>
      <IconButton
        :title="$t('common.close')"
        size="sm"
        @pointerdown.stop
        @click="emit('close')"
      >
        <X />
      </IconButton>
    </header>

    <NodeDetailsMetadata v-if="meta.length" :meta="meta" />
    <NodeDetailsContent
      v-if="contentHtml || downloadUrl"
      :content-html="contentHtml"
      :download-url="downloadUrl"
    />
    <NodeDetailsSection
      v-if="evidenceTexts.length"
      :label="$t('common.memoryEvidenceTag')"
      :items="evidenceTexts"
      tone="neutral"
    />
    <NodeDetailsSection
      v-if="frictionReasons.length"
      :label="$t('common.memoryFrictionTag')"
      :items="frictionReasons"
      tone="warning"
    />
  </div>
</template>

<style scoped>
.node-details-popover {
  position: absolute;
  z-index: 20;
  width: min(22rem, calc(100% - var(--spacing-3)));
  max-height: min(30rem, calc(100% - var(--spacing-3)));
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid
    color-mix(in srgb, var(--color-accent-border) 45%, transparent);
  background-color: color-mix(
    in srgb,
    var(--color-bg-elevated) 55%,
    transparent
  );
  backdrop-filter: blur(1rem) saturate(1.5);
  -webkit-backdrop-filter: blur(1rem) saturate(1.5);
  box-shadow: 0 0.5rem 1.5rem
    color-mix(in srgb, var(--color-bg-primary) 35%, transparent);
}

.node-details-popover:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.node-details-popover__header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 1px solid var(--color-divider);
  background-color: color-mix(
    in srgb,
    var(--color-bg-elevated) 88%,
    transparent
  );
  backdrop-filter: blur(1rem) saturate(1.5);
  -webkit-backdrop-filter: blur(1rem) saturate(1.5);
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.node-details-popover__header:active {
  cursor: grabbing;
}

.node-details-popover__title {
  margin: 0;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}
</style>
