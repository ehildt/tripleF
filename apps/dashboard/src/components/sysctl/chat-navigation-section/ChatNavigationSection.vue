<script setup lang="ts">
/**
 * The SysCtl "Chat navigation" tab. Settings are grouped by what they control,
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

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';
import { i18n } from '@/i18n/i18n';
import { useAppStore } from '@/stores/app';
import type {
  ChartColormap,
  ChartHeatmapVariant,
  ChartPriceStyle,
  ChartVolumeStyle,
  ChatIconKey,
  ScrollMode,
} from '@/types/app.model';

import SectionHeader from '../../shared/ui/section-header/SectionHeader.vue';
import SysCtlSection from '../shared/ui/sysctl-section/SysCtlSection.vue';

const appStore = useAppStore();

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
  appStore.setDefaultScrollMode(mode as ScrollMode);
}

function toggleIcon(key: ChatIconKey) {
  appStore.setChatIconVisibility(key, !appStore.chatIconVisibility[key]);
}

function setPriceStyle(style: string) {
  appStore.setChartConfig({ priceStyle: style as ChartPriceStyle });
}

function setVolumeStyle(style: string) {
  appStore.setChartConfig({ volumeStyle: style as ChartVolumeStyle });
}

function setHeatmapVariant(variant: string) {
  appStore.setChartConfig({ heatmapVariant: variant as ChartHeatmapVariant });
}

function setColormap(colormap: string) {
  appStore.setChartConfig({ colormap: colormap as ChartColormap });
}

function toggleChartAnnotation(
  key: 'showMarkers' | 'showReferenceLines' | 'showTooltip',
) {
  appStore.setChartConfig({ [key]: !appStore.chartConfig[key] });
}
</script>

<template>
  <SysCtlSection>
    <div class="chat-navigation-section">
      <!-- Conversation: how chats scroll and how long temporary chats are kept -->
      <SectionHeader
        :icon="MessagesSquare"
        :title="$t('common.conversationSection')"
      />
      <FieldGrid :items-per-row="2">
        <FieldCard
          :icon="GalleryVerticalEnd"
          :label="$t('common.defaultScrollMode')"
          :description="$t('common.defaultScrollModeDesc')"
        >
          <template #controls>
            <SegmentedToggle
              :options="SCROLL_MODE_OPTIONS"
              :model-value="appStore.defaultScrollMode"
              :aria-label="$t('common.defaultScrollMode')"
              @update:model-value="setDefaultScrollMode"
            />
          </template>
        </FieldCard>

        <FieldCard
          :icon="Clock"
          :label="$t('common.tempRetention')"
          :description="$t('common.tempRetentionDesc')"
          :number-value="appStore.temporaryRetentionMinutes"
          @update:number-value="appStore.setTemporaryRetentionMinutes"
        />

        <FieldCard
          :icon="FileText"
          :label="$t('common.documentTextLimit')"
          :description="$t('common.documentTextLimitDesc')"
          :number-value="appStore.documentTextLimit"
          @update:number-value="appStore.setDocumentTextLimit"
        />
      </FieldGrid>

      <!-- Header actions: which action icons appear on the exchange header -->
      <SectionHeader
        :icon="MousePointerClick"
        :title="$t('common.headerActionsSection')"
      />
      <FieldGrid :items-per-row="4">
        <FieldCard
          v-for="option in ICON_OPTIONS"
          :key="option.key"
          :icon="option.icon"
          :label="$t(option.labelKey)"
          :description="$t(option.descriptionKey)"
          :checked="appStore.chatIconVisibility[option.key]"
          @toggle="toggleIcon(option.key)"
        />
      </FieldGrid>

      <!-- Charts: default style/annotation preferences for stock charts -->
      <SectionHeader
        :icon="ChartCandlestick"
        :title="$t('common.chartSection')"
      />
      <FieldGrid :items-per-row="4">
        <FieldCard
          :icon="ChartCandlestick"
          :label="$t('common.chartPriceStyle')"
          :description="$t('common.chartPriceStyleDesc')"
        >
          <template #controls>
            <SegmentedToggle
              :options="PRICE_STYLE_OPTIONS"
              :model-value="appStore.chartConfig.priceStyle"
              :aria-label="$t('common.chartPriceStyle')"
              @update:model-value="setPriceStyle"
            />
          </template>
        </FieldCard>

        <FieldCard
          :icon="ChartColumnStacked"
          :label="$t('common.chartVolumeStyle')"
          :description="$t('common.chartVolumeStyleDesc')"
        >
          <template #controls>
            <SegmentedToggle
              :options="VOLUME_STYLE_OPTIONS"
              :model-value="appStore.chartConfig.volumeStyle"
              :aria-label="$t('common.chartVolumeStyle')"
              @update:model-value="setVolumeStyle"
            />
          </template>
        </FieldCard>

        <FieldCard
          :icon="WavesHorizontal"
          :label="$t('common.chartHeatmapVariant')"
          :description="$t('common.chartHeatmapVariantDesc')"
        >
          <template #controls>
            <SegmentedToggle
              :options="HEATMAP_VARIANT_OPTIONS"
              :model-value="appStore.chartConfig.heatmapVariant"
              :aria-label="$t('common.chartHeatmapVariant')"
              @update:model-value="setHeatmapVariant"
            />
          </template>
        </FieldCard>

        <FieldCard
          :icon="Palette"
          :label="$t('common.chartColormap')"
          :description="$t('common.chartColormapDesc')"
        >
          <template #controls>
            <SegmentedToggle
              :options="COLORMAP_OPTIONS"
              :model-value="appStore.chartConfig.colormap"
              :aria-label="$t('common.chartColormap')"
              @update:model-value="setColormap"
            />
          </template>
        </FieldCard>

        <FieldCard
          :icon="Bookmark"
          :label="$t('common.chartMarkers')"
          :description="$t('common.chartShowMarkersDesc')"
          :checked="appStore.chartConfig.showMarkers"
          @toggle="toggleChartAnnotation('showMarkers')"
        />

        <FieldCard
          :icon="Tag"
          :label="$t('common.chartReferenceLines')"
          :description="$t('common.chartShowReferenceLinesDesc')"
          :checked="appStore.chartConfig.showReferenceLines"
          @toggle="toggleChartAnnotation('showReferenceLines')"
        />

        <FieldCard
          :icon="MirrorRectangular"
          :label="$t('common.chartTooltip')"
          :description="$t('common.chartShowTooltipDesc')"
          :checked="appStore.chartConfig.showTooltip"
          @toggle="toggleChartAnnotation('showTooltip')"
        />
      </FieldGrid>
    </div>
  </SysCtlSection>
</template>

<style scoped>
.chat-navigation-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
