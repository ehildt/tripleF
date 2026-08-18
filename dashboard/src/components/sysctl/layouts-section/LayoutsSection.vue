<script setup lang="ts">
/**
 * The SysCtl "Layouts" tab: one submenu tab per response template (news,
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
  MessageSquare,
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

import {
  TEMPLATE_NAMES,
  TEMPLATE_PARTS,
  type TemplateName,
} from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/template-parts.constant';
import {
  isTemplatePartVisible,
  toggleTemplatePartVisible,
} from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/template-parts-settings.state';
import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import { i18n } from '@/i18n/i18n';

import SysCtlSection from '../shared/ui/sysctl-section/SysCtlSection.vue';
import SysCtlSectionHeader from '../shared/ui/sysctl-section-header/SysCtlSectionHeader.vue';
import SysCtlSubMenu from '../shared/ui/sysctl-submenu/SysCtlSubMenu.vue';

const TEMPLATE_META: Record<TemplateName, { icon: LucideIcon }> = {
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
  text: { icon: MessageSquare },
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
  tooltipKey: string;
  icon: LucideIcon;
}

function singleTemplateSubtab(template: TemplateName): LayoutSubtab {
  return {
    id: template,
    templates: [template],
    labelKey: templateLabelKey(template),
    tooltipKey: templateTooltipKey(template),
    icon: TEMPLATE_META[template].icon,
  };
}

const STOCKMARKET_SUBTAB: LayoutSubtab = {
  id: 'stockmarket',
  templates: ['stockmarketitem', 'stockmarketlist'],
  labelKey: 'common.templateStockmarket',
  tooltipKey: 'common.templateStockmarketTooltip',
  icon: ChartCandlestick,
};

const SUBTABS: LayoutSubtab[] = TEMPLATE_NAMES.flatMap((name) => {
  if (name === 'stockmarketitem') return [STOCKMARKET_SUBTAB];
  if (name === 'stockmarketlist') return [];
  return [singleTemplateSubtab(name)];
});

const SUBTAB_ITEMS = SUBTABS.map((subtab) => ({
  id: subtab.id,
  label: i18n.global.t(subtab.labelKey),
  tooltip: i18n.global.t(subtab.tooltipKey),
  icon: subtab.icon,
}));

const activeSubtabId = ref(SUBTABS[0].id);
const activeSubtab = computed(
  () =>
    SUBTABS.find((subtab) => subtab.id === activeSubtabId.value) ?? SUBTABS[0],
);

/** The part catalog of the subtab's representative template (merged pairs match). */
const activeParts = computed(
  () => TEMPLATE_PARTS[activeSubtab.value.templates[0]],
);

/** Subtabs whose responses keep the always-on discarded-references aside. */
const DISCARDED_ASIDE_TEMPLATES: readonly TemplateName[] = [
  'describe',
  'compare',
  'ocr',
];

function isPartChecked(partId: string): boolean {
  return activeSubtab.value.templates.every((template) =>
    isTemplatePartVisible(template, partId),
  );
}

function togglePart(partId: string) {
  for (const template of activeSubtab.value.templates) {
    toggleTemplatePartVisible(template, partId);
  }
}

/** The label key for a template name, e.g. "common.templateArticle". */
function templateLabelKey(template: TemplateName): string {
  return `common.template${template.charAt(0).toUpperCase()}${template.slice(1)}`;
}

/** The tooltip key for a template name, e.g. "common.templateArticleTooltip". */
function templateTooltipKey(template: TemplateName): string {
  return `common.template${template.charAt(0).toUpperCase()}${template.slice(1)}Tooltip`;
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
  <SysCtlSection>
    <div class="layouts-section">
      <SysCtlSubMenu
        :items="SUBTAB_ITEMS"
        :active="activeSubtabId"
        @select="activeSubtabId = $event as string"
      />

      <SysCtlSectionHeader
        :icon="activeSubtab.icon"
        :title="$t(activeSubtab.labelKey)"
      />
      <p
        v-if="
          activeSubtab.templates.some((template) =>
            DISCARDED_ASIDE_TEMPLATES.includes(template),
          )
        "
        class="layouts-section__hint"
      >
        {{ $t('common.layoutsDiscardedAsideNote') }}
      </p>

      <p v-if="activeParts.length === 0" class="layouts-section__none">
        {{ $t('common.layoutsNoParts') }}
      </p>
      <FieldGrid v-else :items-per-row="5">
        <FieldCard
          v-for="part in activeParts"
          :key="part.id"
          :icon="activeSubtab.icon"
          :label="$t(partLabelKey(part.id))"
          :checked="isPartChecked(part.id)"
          @toggle="togglePart(part.id)"
        />
      </FieldGrid>
    </div>
  </SysCtlSection>
</template>

<style scoped>
.layouts-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.layouts-section__hint {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  line-height: 1.5;
  color: var(--color-fg-muted);
  margin: 0;
}

.layouts-section__none {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-fg-muted);
  margin: 0;
}
</style>
