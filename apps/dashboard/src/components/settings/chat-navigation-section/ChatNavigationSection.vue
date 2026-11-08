<script setup lang="ts">
/**
 * The Settings "Chat navigation" tab. Settings are grouped by what they control,
 * each group with its own section header:
 *
 * - Conversation: how the exchange list scrolls and how long temporary chats
 *   are retained (both conversation-level defaults).
 * - Media: how response media is ordered (image vs video galleries).
 * - Header actions: which action icons appear on the exchange header.
 * - Charts: default style/annotation preferences every stock chart inherits.
 */
import {
  Bookmark,
  ChartArea,
  ChartCandlestick,
  ChartColumnStacked,
  ChartLine,
  Clock,
  Copy,
  FileText,
  Form,
  GalleryVerticalEnd,
  GitBranch,
  Leaf,
  type LucideIcon,
  MessagesSquare,
  MirrorRectangular,
  MousePointerClick,
  Palette,
  Sparkles,
  SquaresExclude,
  TableCellsSplit,
  Tag,
  Trash2,
  WavesHorizontal,
  ZodiacAquarius,
} from '@lucide/vue';
import { computed } from 'vue';

import SettingsSection from '@/components/settings/shared/ui/settings-section/SettingsSection.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import type { SegmentedFieldCardToggle } from '@/components/shared/ui/segmented-field-card/SegmentedFieldCard.types';
import SegmentedFieldCard from '@/components/shared/ui/segmented-field-card/SegmentedFieldCard.vue';
import { i18n } from '@/i18n/i18n';
import type {
  ChartColormap,
  ChartHeatmapVariant,
  ChartPriceStyle,
  ChartVolumeStyle,
} from '@/stores/chat/chart-settings/chart-settings.model';
import { useChartSettingsStore } from '@/stores/chat/chart-settings/chart-settings.store';
import type {
  ChatIconKey,
  ScrollMode,
} from '@/stores/chat/chat-navigation-settings/chat-navigation-settings.model';
import { useChatNavigationSettingsStore } from '@/stores/chat/chat-navigation-settings/chat-navigation-settings.store';
import { useConversationSettingsStore } from '@/stores/chat/conversation-settings/conversation-settings.store';

const chartSettingsStore = useChartSettingsStore();
const chatNavigationSettingsStore = useChatNavigationSettingsStore();
const conversationSettingsStore = useConversationSettingsStore();

const SCROLL_MODE_OPTIONS = computed<
  readonly { value: ScrollMode; icon: LucideIcon; tooltip: string }[]
>(() => [
  {
    value: 'carousel',
    icon: GalleryVerticalEnd,
    tooltip: i18n.global.t('common.scrollModeCarousel'),
  },
  {
    value: 'native',
    icon: Form,
    tooltip: i18n.global.t('common.scrollModeNative'),
  },
]);

const PRICE_STYLE_OPTIONS = computed<
  readonly { value: ChartPriceStyle; icon: LucideIcon; tooltip: string }[]
>(() => [
  {
    value: 'candles',
    icon: ChartCandlestick,
    tooltip: i18n.global.t('common.chartCandles'),
  },
  {
    value: 'line',
    icon: ChartLine,
    tooltip: i18n.global.t('common.chartLine'),
  },
  {
    value: 'area',
    icon: ChartArea,
    tooltip: i18n.global.t('common.chartArea'),
  },
]);

const VOLUME_STYLE_OPTIONS = computed<
  readonly { value: ChartVolumeStyle; icon: LucideIcon; tooltip: string }[]
>(() => [
  {
    value: 'histogram',
    icon: ChartColumnStacked,
    tooltip: i18n.global.t('common.chartVolume'),
  },
  {
    value: 'heatmap',
    icon: WavesHorizontal,
    tooltip: i18n.global.t('common.chartHeatmap'),
  },
]);

const HEATMAP_VARIANT_OPTIONS = computed<
  readonly { value: ChartHeatmapVariant; icon: LucideIcon; tooltip: string }[]
>(() => [
  {
    value: 'cells',
    icon: TableCellsSplit,
    tooltip: i18n.global.t('common.chartCells'),
  },
  {
    value: 'flow',
    icon: ZodiacAquarius,
    tooltip: i18n.global.t('common.chartFlow'),
  },
]);

const COLORMAP_OPTIONS = computed<
  readonly { value: ChartColormap; icon: LucideIcon; tooltip: string }[]
>(() => [
  {
    value: 'turbo',
    icon: Palette,
    tooltip: i18n.global.t('common.chartColormapTurbo'),
  },
  {
    value: 'green',
    icon: Leaf,
    tooltip: i18n.global.t('common.chartColormapGreen'),
  },
  {
    value: 'purple',
    icon: Sparkles,
    tooltip: i18n.global.t('common.chartColormapPurple'),
  },
]);

const ICON_OPTIONS: readonly {
  key: ChatIconKey;
  icon: LucideIcon;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    key: 'copy',
    icon: Copy,
    labelKey: 'common.chatIconCopy',
    descriptionKey: 'common.chatIconCopyDesc',
  },
  {
    key: 'include',
    icon: SquaresExclude,
    labelKey: 'common.chatIconInclude',
    descriptionKey: 'common.chatIconIncludeDesc',
  },
  {
    key: 'branch',
    icon: GitBranch,
    labelKey: 'common.chatIconBranch',
    descriptionKey: 'common.chatIconBranchDesc',
  },
  {
    key: 'delete',
    icon: Trash2,
    labelKey: 'common.chatIconDelete',
    descriptionKey: 'common.chatIconDeleteDesc',
  },
];

function setDefaultScrollMode(mode: string) {
  chatNavigationSettingsStore.setDefaultScrollMode(mode as ScrollMode);
}

function toggleIcon(key: ChatIconKey) {
  chatNavigationSettingsStore.setChatIconVisibility(
    key,
    !chatNavigationSettingsStore.chatIconVisibility[key],
  );
}

function setPriceStyle(style: string) {
  chartSettingsStore.setChartConfig({ priceStyle: style as ChartPriceStyle });
}

function setVolumeStyle(style: string) {
  chartSettingsStore.setChartConfig({ volumeStyle: style as ChartVolumeStyle });
}

function setHeatmapVariant(variant: string) {
  chartSettingsStore.setChartConfig({
    heatmapVariant: variant as ChartHeatmapVariant,
  });
}

function setColormap(colormap: string) {
  chartSettingsStore.setChartConfig({ colormap: colormap as ChartColormap });
}

function toggleChartAnnotation(
  key: 'showMarkers' | 'showReferenceLines' | 'showTooltip',
) {
  chartSettingsStore.setChartConfig({
    [key]: !chartSettingsStore.chartConfig[key],
  });
}

/** Segmented-card descriptors: explicit (options, value, handler) triples. */
const SCROLL_MODE_TOGGLES = computed<readonly SegmentedFieldCardToggle[]>(
  () => [
    {
      key: 'scroll-mode',
      ariaLabel: i18n.global.t('common.defaultScrollMode'),
      options: SCROLL_MODE_OPTIONS.value,
      value: chatNavigationSettingsStore.defaultScrollMode,
      onSelect: setDefaultScrollMode,
    },
  ],
);

const PRICE_STYLE_TOGGLES = computed<readonly SegmentedFieldCardToggle[]>(
  () => [
    {
      key: 'price-style',
      ariaLabel: i18n.global.t('common.chartPriceStyle'),
      options: PRICE_STYLE_OPTIONS.value,
      value: chartSettingsStore.chartConfig.priceStyle,
      onSelect: setPriceStyle,
    },
  ],
);

const VOLUME_STYLE_TOGGLES = computed<readonly SegmentedFieldCardToggle[]>(
  () => [
    {
      key: 'volume-style',
      ariaLabel: i18n.global.t('common.chartVolumeStyle'),
      options: VOLUME_STYLE_OPTIONS.value,
      value: chartSettingsStore.chartConfig.volumeStyle,
      onSelect: setVolumeStyle,
    },
  ],
);

const HEATMAP_VARIANT_TOGGLES = computed<readonly SegmentedFieldCardToggle[]>(
  () => [
    {
      key: 'heatmap-variant',
      ariaLabel: i18n.global.t('common.chartHeatmapVariant'),
      options: HEATMAP_VARIANT_OPTIONS.value,
      value: chartSettingsStore.chartConfig.heatmapVariant,
      onSelect: setHeatmapVariant,
    },
  ],
);

const COLORMAP_TOGGLES = computed<readonly SegmentedFieldCardToggle[]>(() => [
  {
    key: 'colormap',
    ariaLabel: i18n.global.t('common.chartColormap'),
    options: COLORMAP_OPTIONS.value,
    value: chartSettingsStore.chartConfig.colormap,
    onSelect: setColormap,
  },
]);
</script>

<template>
  <SettingsSection>
    <div class="chat-navigation-section">
      <!-- Conversation: how chats scroll and how long temporary chats are kept -->
      <SectionHeader
        :icon="MessagesSquare"
        :title="$t('common.conversationSection')"
      />
      <FieldGrid :items-per-row="2">
        <SegmentedFieldCard
          :icon="GalleryVerticalEnd"
          :label="$t('common.defaultScrollMode')"
          :description="$t('common.defaultScrollModeDesc')"
          :toggles="SCROLL_MODE_TOGGLES"
        />

        <NumberFieldCard
          :icon="Clock"
          :label="$t('common.tempRetention')"
          :description="$t('common.tempRetentionDesc')"
          :number-value="conversationSettingsStore.temporaryRetentionMinutes"
          @update:number-value="
            conversationSettingsStore.setTemporaryRetentionMinutes
          "
        />

        <NumberFieldCard
          :icon="FileText"
          :label="$t('common.documentTextLimit')"
          :description="$t('common.documentTextLimitDesc')"
          :number-value="conversationSettingsStore.documentTextLimit"
          @update:number-value="conversationSettingsStore.setDocumentTextLimit"
        />
      </FieldGrid>

      <!-- Header actions: which action icons appear on the exchange header -->
      <SectionHeader
        :icon="MousePointerClick"
        :title="$t('common.headerActionsSection')"
      />
      <FieldGrid :items-per-row="4">
        <NumberFieldCard
          v-for="option in ICON_OPTIONS"
          :key="option.key"
          :icon="option.icon"
          :label="$t(option.labelKey)"
          :description="$t(option.descriptionKey)"
          :checked="chatNavigationSettingsStore.chatIconVisibility[option.key]"
          @toggle="toggleIcon(option.key)"
        />
      </FieldGrid>

      <!-- Charts: default style/annotation preferences for stock charts -->
      <SectionHeader
        :icon="ChartCandlestick"
        :title="$t('common.chartSection')"
      />
      <FieldGrid :items-per-row="4">
        <SegmentedFieldCard
          :icon="ChartCandlestick"
          :label="$t('common.chartPriceStyle')"
          :description="$t('common.chartPriceStyleDesc')"
          :toggles="PRICE_STYLE_TOGGLES"
        />

        <SegmentedFieldCard
          :icon="ChartColumnStacked"
          :label="$t('common.chartVolumeStyle')"
          :description="$t('common.chartVolumeStyleDesc')"
          :toggles="VOLUME_STYLE_TOGGLES"
        />

        <SegmentedFieldCard
          :icon="WavesHorizontal"
          :label="$t('common.chartHeatmapVariant')"
          :description="$t('common.chartHeatmapVariantDesc')"
          :toggles="HEATMAP_VARIANT_TOGGLES"
        />

        <SegmentedFieldCard
          :icon="Palette"
          :label="$t('common.chartColormap')"
          :description="$t('common.chartColormapDesc')"
          :toggles="COLORMAP_TOGGLES"
        />

        <NumberFieldCard
          :icon="Bookmark"
          :label="$t('common.chartMarkers')"
          :description="$t('common.chartShowMarkersDesc')"
          :checked="chartSettingsStore.chartConfig.showMarkers"
          @toggle="toggleChartAnnotation('showMarkers')"
        />

        <NumberFieldCard
          :icon="Tag"
          :label="$t('common.chartReferenceLines')"
          :description="$t('common.chartShowReferenceLinesDesc')"
          :checked="chartSettingsStore.chartConfig.showReferenceLines"
          @toggle="toggleChartAnnotation('showReferenceLines')"
        />

        <NumberFieldCard
          :icon="MirrorRectangular"
          :label="$t('common.chartTooltip')"
          :description="$t('common.chartShowTooltipDesc')"
          :checked="chartSettingsStore.chartConfig.showTooltip"
          @toggle="toggleChartAnnotation('showTooltip')"
        />
      </FieldGrid>
    </div>
  </SettingsSection>
</template>

<style scoped>
.chat-navigation-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  /* No sub tab menu on this tab: the larger below-chrome air that usually
     sits under a menu line goes here, above the content. */
  padding-top: var(--spacing-3);
}
</style>
