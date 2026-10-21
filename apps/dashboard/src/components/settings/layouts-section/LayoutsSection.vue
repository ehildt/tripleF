<script setup lang="ts">
/**
 * The Settings "Layouts" tab: one submenu tab per response template (news,
 * article, describe, compare, …). Each template tab lists its toggleable
 * parts — image gallery, video gallery, key findings, quote, sources, … —
 * as checkbox fields. This is a pure client-side display preference: the
 * model still produces every part, disabling one just hides that section
 * in the rendered response.
 */
import {
  ChartCandlestick,
  FileText,
  GitCompare,
  Images,
  ListChecks,
  type LucideIcon,
  Newspaper,
  Scale,
  ScanText,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Video,
} from '@lucide/vue';
import { computed, ref } from 'vue';

import SettingsSection from '@/components/settings/shared/ui/settings-section/SettingsSection.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SettingsSubMenu from '@/components/shared/ui/settings-submenu/SettingsSubMenu.vue';
import { i18n } from '@/i18n/i18n';
import {
  TEMPLATE_NAMES,
  TEMPLATE_PARTS,
  type TemplateName,
} from '@/stores/template-parts.constant';
import { useTemplatePartsSettingsStore } from '@/stores/template-parts-settings';

import { useSettingsConfig } from '../composables/use-settings-config';
import { mapSubtabToItem } from './helpers/map-subtab-to-item.helper';

const templatePartsSettingsStore = useTemplatePartsSettingsStore();

const TEMPLATE_META: Record<
  Exclude<TemplateName, 'text'>,
  { icon: LucideIcon }
> = {
  article: { icon: FileText },
  news: { icon: Newspaper },
  describe: { icon: Sparkles },
  compare: { icon: GitCompare },
  ocr: { icon: ScanText },
  summary: { icon: ListChecks },
  evaluation: { icon: Scale },
  product: { icon: ShoppingBag },
  shoplist: { icon: ShoppingCart },
  imagelist: { icon: Images },
  videolist: { icon: Video },
  stockmarketitem: { icon: ChartCandlestick },
  stockmarketlist: { icon: TrendingUp },
};

/**
 * One submenu tab per response template — except the stock-market pair,
 * whose templates share the same toggleable parts, so they share one tab.
 * Each subtab maps to the real response template(s) it configures.
 */
interface LayoutSubtab {
  id: string;
  templates: TemplateName[];
  labelKey: string;
  icon: LucideIcon;
}

function singleTemplateSubtab(
  template: Exclude<TemplateName, 'text'>,
): LayoutSubtab {
  return {
    id: template,
    templates: [template],
    labelKey: templateLabelKey(template),
    icon: TEMPLATE_META[template].icon,
  };
}

const STOCKMARKET_SUBTAB: LayoutSubtab = {
  id: 'stockmarket',
  templates: ['stockmarketitem', 'stockmarketlist'],
  labelKey: 'common.templateStockmarket',
  icon: ChartCandlestick,
};

const SUBTABS: LayoutSubtab[] = TEMPLATE_NAMES.flatMap((name) => {
  // The plain-text template has no toggleable parts, so no subtab for it.
  if (name === 'text') return [];
  if (name === 'stockmarketitem') return [STOCKMARKET_SUBTAB];
  if (name === 'stockmarketlist') return [];
  return [singleTemplateSubtab(name)];
});

const { config } = useSettingsConfig();
const eodhdEnabled = computed(() => config.value?.eodhd?.enabled === true);

const SUBTAB_ITEMS = computed(() =>
  SUBTABS.map((subtab) =>
    mapSubtabToItem(subtab, eodhdEnabled.value, i18n.global.t),
  ),
);

const activeSubtabId = ref(SUBTABS[0].id);
const activeSubtab = computed(
  () =>
    SUBTABS.find((subtab) => subtab.id === activeSubtabId.value) ?? SUBTABS[0],
);

/** The part catalog of the subtab's representative template (merged pairs match). */
const activeParts = computed(
  () => TEMPLATE_PARTS[activeSubtab.value.templates[0]],
);

function isPartChecked(partId: string): boolean {
  return activeSubtab.value.templates.every((template) =>
    templatePartsSettingsStore.isTemplatePartVisible(template, partId),
  );
}

function togglePart(partId: string) {
  for (const template of activeSubtab.value.templates) {
    templatePartsSettingsStore.toggleTemplatePartVisible(template, partId);
  }
}

/** The label key for a template name, e.g. "common.templateArticle". */
function templateLabelKey(template: TemplateName): string {
  return `common.template${template.charAt(0).toUpperCase()}${template.slice(1)}`;
}

/** The label key for a part id, e.g. "common.templateSectionGallery". */
function partLabelKey(partId: string): string {
  const pascal = partId
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .split(' ')
    .join('');
  return `common.templateSection${pascal}`;
}
</script>

<template>
  <SettingsSection>
    <div class="layouts-section">
      <SettingsSubMenu
        :items="SUBTAB_ITEMS"
        :active="activeSubtabId"
        @select="activeSubtabId = $event as string"
      />

      <FieldGrid :items-per-row="5">
        <NumberFieldCard
          v-for="part in activeParts"
          :key="part.id"
          :icon="activeSubtab.icon"
          :label="$t(partLabelKey(part.id))"
          :checked="isPartChecked(part.id)"
          @toggle="togglePart(part.id)"
        />
      </FieldGrid>
    </div>
  </SettingsSection>
</template>

<style scoped>
.layouts-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
