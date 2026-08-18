<script setup lang="ts">
import type { Component } from 'vue';
import { computed, provide } from 'vue';

import type {
  GalleryItem,
  HarnessImageClickedHandler,
  HarnessResponseData,
} from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';
import type { LightboxImage } from '@/types/lightbox.model';

import { isTrustedImageUrl } from './composables/helpers/media/is-trusted-image-url.helper';
import { TEMPLATE_PARTS } from './composables/template-parts.constant';
import { isTemplatePartVisible } from './composables/template-parts-settings.state';
import ArticleResponse from './templates/article-response/ArticleResponse.vue';
import CompareResponse from './templates/compare-response/CompareResponse.vue';
import DescribeResponse from './templates/describe-response/DescribeResponse.vue';
import EvaluationResponse from './templates/evaluation-response/EvaluationResponse.vue';
import ImageListResponse from './templates/imagelist-response/ImageListResponse.vue';
import MergeResponse from './templates/merge-response/MergeResponse.vue';
import NewsResponse from './templates/news-response/NewsResponse.vue';
import OcrResponse from './templates/ocr-response/OcrResponse.vue';
import ProductResponse from './templates/product-response/ProductResponse.vue';
import ShopListResponse from './templates/shoplist-response/ShopListResponse.vue';
import StockmarketItemResponse from './templates/stockmarket-item-response/StockmarketItemResponse.vue';
import StockmarketListResponse from './templates/stockmarket-list-response/StockmarketListResponse.vue';
import SummaryResponse from './templates/summary-response/SummaryResponse.vue';
import TextResponse from './templates/text-response/TextResponse.vue';
import VideoListResponse from './templates/videolist-response/VideoListResponse.vue';

const props = defineProps<{
  template: string;
  data?: HarnessResponseData;
  text?: string;
  /** Chart data streamed from EODHD tools, keyed by tool name. */
  chartData?: Record<string, unknown>;
  /** True once the respond step starts streaming — reveal the charts. */
  revealCharts?: boolean;
}>();

const emit = defineEmits<{
  (e: 'imageClicked', images: LightboxImage[], clickedUrl: string): void;
}>();

const templateMap: Record<string, Component> = {
  article: ArticleResponse,
  compare: CompareResponse,
  describe: DescribeResponse,
  evaluation: EvaluationResponse,
  imagelist: ImageListResponse,
  merge: MergeResponse,
  news: NewsResponse,
  ocr: OcrResponse,
  product: ProductResponse,
  shoplist: ShopListResponse,
  stockmarketitem: StockmarketItemResponse,
  stockmarketlist: StockmarketListResponse,
  summary: SummaryResponse,
  text: TextResponse,
  videolist: VideoListResponse,
};

const activeComponent = computed(
  () => templateMap[props.template] ?? TextResponse,
);

/**
 * The client-side part visibility (SysCtl → Layouts): drop the data keys of
 * every disabled part before the template renders. Sections self-hide when
 * their data is absent, so a disabled part simply never renders — the model
 * output is untouched.
 */
const visibleData = computed<HarnessResponseData>(() => {
  const parts = TEMPLATE_PARTS[props.template as keyof typeof TEMPLATE_PARTS];
  if (!parts || parts.length === 0) return props.data ?? {};
  const hiddenKeys = new Set<string>();
  for (const part of parts) {
    if (!isTemplatePartVisible(props.template, part.id)) {
      for (const key of part.keys) hiddenKeys.add(key);
    }
  }
  if (hiddenKeys.size === 0) return props.data ?? {};
  const result: Record<string, unknown> = { ...props.data };
  for (const key of hiddenKeys) delete result[key];
  return result as HarnessResponseData;
});

/**
 * Only the stockmarket templates consume chartData/revealCharts. Passing
 * them to every template would leak them as fallthrough DOM attributes (and
 * warn on the object value), so they are bound only for stockmarket templates.
 */
const stockmarketProps = computed(() => {
  if (
    props.template !== 'stockmarketitem' &&
    props.template !== 'stockmarketlist'
  )
    return {};
  return { chartData: props.chartData, revealCharts: props.revealCharts };
});

const imageList = computed<LightboxImage[]>(() => {
  const items: LightboxImage[] = [];
  // Dedupe by URL (first occurrence wins): the model sometimes repeats the
  // hero in the gallery or lists an image twice — the lightbox would show
  // the same image on two consecutive stops.
  const seenUrls = new Set<string>();
  const pushImage = (url: string, title: string) => {
    if (seenUrls.has(url)) return;
    seenUrls.add(url);
    items.push({ url, title });
  };

  if (
    visibleData.value.heroImageUrl &&
    isTrustedImageUrl(visibleData.value.heroImageUrl)
  ) {
    pushImage(
      encodeURI(visibleData.value.heroImageUrl),
      buildImageTitle(
        visibleData.value.heroImageAlt,
        visibleData.value.heroCaption,
        visibleData.value.title,
      ),
    );
  }

  // Merge topic heroes render inline inside their topic block — include
  // them so clicking one opens a lightbox that actually contains it.
  visibleData.value.bodySections?.forEach((section) => {
    if (section.heroImageUrl && isTrustedImageUrl(section.heroImageUrl)) {
      pushImage(
        encodeURI(section.heroImageUrl),
        buildImageTitle(
          section.heroImageAlt,
          section.heroCaption,
          section.topic || visibleData.value.title,
        ),
      );
    }
  });

  visibleData.value.galleryItems?.forEach((item) => {
    if (item.imageUrl && isTrustedImageUrl(item.imageUrl)) {
      pushImage(
        encodeURI(item.imageUrl),
        buildImageTitle(item.imageAlt, item.title, visibleData.value?.title),
      );
    }
  });

  return items;
});

function buildImageTitle(
  alt?: string,
  title?: string,
  fallback?: string,
): string {
  return (
    (alt && alt.trim()) ||
    (title && title.trim()) ||
    fallback?.trim() ||
    'Image'
  );
}

function onImageClicked(item: GalleryItem) {
  if (!item.imageUrl || !isTrustedImageUrl(item.imageUrl)) return;
  emit('imageClicked', imageList.value, encodeURI(item.imageUrl));
}

provide<HarnessImageClickedHandler>(harnessImageClickedKey, onImageClicked);
</script>

<template>
  <component
    :is="activeComponent"
    :data="visibleData"
    :text="text"
    v-bind="stockmarketProps"
  />
</template>
