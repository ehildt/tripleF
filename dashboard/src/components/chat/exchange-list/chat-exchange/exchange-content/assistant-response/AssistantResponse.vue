<script setup lang="ts">
import type { Component } from 'vue';
import { computed, provide } from 'vue';

import type {
  GalleryItem,
  HarnessImageClickedHandler,
  HarnessResponseData,
} from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import { isTrustedImageUrl } from './composables/helpers/is-trusted-image-url.helper';
import ArticleResponse from './templates/article-response/ArticleResponse.vue';
import CompareResponse from './templates/compare-response/CompareResponse.vue';
import DescribeResponse from './templates/describe-response/DescribeResponse.vue';
import EvaluationResponse from './templates/evaluation-response/EvaluationResponse.vue';
import ImageListResponse from './templates/imagelist-response/ImageListResponse.vue';
import NewsResponse from './templates/news-response/NewsResponse.vue';
import OcrResponse from './templates/ocr-response/OcrResponse.vue';
import ProductResponse from './templates/product-response/ProductResponse.vue';
import ShopListResponse from './templates/shoplist-response/ShopListResponse.vue';
import SummaryResponse from './templates/summary-response/SummaryResponse.vue';
import TextResponse from './templates/text-response/TextResponse.vue';
import VideoListResponse from './templates/videolist-response/VideoListResponse.vue';

interface LightboxImage {
  url: string;
  title?: string;
}

const props = defineProps<{
  template: string;
  data?: HarnessResponseData;
  text?: string;
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
  news: NewsResponse,
  ocr: OcrResponse,
  product: ProductResponse,
  shoplist: ShopListResponse,
  summary: SummaryResponse,
  text: TextResponse,
  videolist: VideoListResponse,
};

const activeComponent = computed(
  () => templateMap[props.template] ?? TextResponse,
);

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

  if (props.data?.heroImageUrl && isTrustedImageUrl(props.data.heroImageUrl)) {
    pushImage(
      encodeURI(props.data.heroImageUrl),
      buildImageTitle(
        props.data.heroImageAlt,
        props.data.heroCaption,
        props.data.title,
      ),
    );
  }

  props.data?.galleryItems?.forEach((item) => {
    if (item.imageUrl && isTrustedImageUrl(item.imageUrl)) {
      pushImage(
        encodeURI(item.imageUrl),
        buildImageTitle(item.imageAlt, item.title, props.data?.title),
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
  <component :is="activeComponent" :data="data ?? {}" :text="text" />
</template>
