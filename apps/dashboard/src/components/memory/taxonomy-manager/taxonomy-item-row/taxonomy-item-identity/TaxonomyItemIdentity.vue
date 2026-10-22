<script setup lang="ts">
/**
 * The identity column of a taxonomy item row: title row (name + kind badge)
 * over a byline of stat chips, maintenance stamps, and the alias trail.
 * Everything derives from the item — pure presentation, nothing emits.
 * The kind tint arrives on the row-level --kind-tint custom property, set by
 * the row's kind modifier.
 */
import { computed } from 'vue';

import { i18n } from '@/i18n/i18n';

import type { TaxonomyItemKind } from '../../shared/ui/taxonomy-kind-chip/TaxonomyKindChip.types';
import TaxonomyStatChips from '../../shared/ui/taxonomy-stat-chips/TaxonomyStatChips.vue';
import type { TaxonomyItemIdentityProps } from './TaxonomyItemIdentity.types';

/** Tier → localized badge label key (exhaustive — a new tier fails to compile). */
const KIND_LABEL_KEYS: Record<TaxonomyItemKind, string> = {
  cluster: 'common.memoryTaxonomyCluster',
  community: 'common.memoryTaxonomyCommunity',
  hub: 'common.memoryTaxonomyHub',
  node: 'common.memoryTaxonomyNode',
  tag: 'common.memoryTaxonomyTag',
};

const props = defineProps<TaxonomyItemIdentityProps>();

/** The localized kind badge label. */
const kindLabel = computed(() =>
  i18n.global.t(KIND_LABEL_KEYS[props.item.kind]),
);

/** Maintenance stamp rows (dates only — the constellation carries the rest). */
const stamps = computed(() => {
  const rows: Array<{ label: string; value: string }> = [];
  if (props.item.lastReflectedAt) {
    rows.push({
      label: i18n.global.t('common.memoryTaxonomyStampReflected'),
      value: props.item.lastReflectedAt.slice(0, 10),
    });
  }
  if (props.item.lastConsolidatedAt) {
    rows.push({
      label: i18n.global.t('common.memoryTaxonomyStampConsolidated'),
      value: props.item.lastConsolidatedAt.slice(0, 10),
    });
  }
  if (props.item.lastRelinkedAt) {
    rows.push({
      label: i18n.global.t('common.memoryTaxonomyStampRelinked'),
      value: props.item.lastRelinkedAt.slice(0, 10),
    });
  }
  return rows;
});

/** Inline stamp line and its full hover text (both formats from the rows). */
const stampsText = computed(() =>
  stamps.value.map((row) => `${row.label} ${row.value}`).join(' · '),
);
const stampsTitle = computed(() =>
  stamps.value.map((row) => `${row.label}: ${row.value}`).join('\n'),
);

/** Alias trail hover text: "alias (source)" per line. */
const aliasesTitle = computed(() =>
  props.item.aliases.map((a) => `${a.alias} (${a.source})`).join('\n'),
);
</script>

<template>
  <div class="taxonomy-item-identity">
    <div class="taxonomy-item-identity__title-row">
      <span class="taxonomy-item-identity__name">{{ item.name }}</span>
      <span class="taxonomy-item-identity__kind">{{ kindLabel }}</span>
    </div>
    <div class="taxonomy-item-identity__byline">
      <TaxonomyStatChips :item="item" />
      <span
        v-if="stamps.length > 0"
        class="taxonomy-item-identity__stamps"
        :title="stampsTitle"
      >
        {{ stampsText }}
      </span>
      <span
        v-if="item.aliases.length > 0"
        class="taxonomy-item-identity__aliases"
        :title="aliasesTitle"
      >
        {{
          $t('common.memoryTaxonomyAliases', {
            count: item.aliases.length,
          })
        }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.taxonomy-item-identity {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: 0;
  flex: 1;
}

.taxonomy-item-identity__title-row {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  min-width: 0;
}

.taxonomy-item-identity__name {
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-fg-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.taxonomy-item-identity__kind {
  flex-shrink: 0;
  padding: 0 var(--spacing-1);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--kind-tint);
  border: 1px solid color-mix(in srgb, var(--kind-tint) 40%, transparent);
}

.taxonomy-item-identity__byline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  min-width: 0;
}

.taxonomy-item-identity__stamps,
.taxonomy-item-identity__aliases {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.taxonomy-item-identity__aliases {
  font-style: italic;
}
</style>
