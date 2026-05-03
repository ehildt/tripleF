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
import NewsResponse from './templates/news-response/NewsResponse.vue';
import OcrResponse from './templates/ocr-response/OcrResponse.vue';
import SummaryResponse from './templates/summary-response/SummaryResponse.vue';
import TextResponse from './templates/text-response/TextResponse.vue';

const props = defineProps<{
  template: string;
  data?: HarnessResponseData;
  text?: string;
}>();

const emit = defineEmits<{
  imageClicked: [images: string[], clickedSrc: string];
}>();

const templateMap: Record<string, Component> = {
  article: ArticleResponse,
  compare: CompareResponse,
  describe: DescribeResponse,
  evaluation: EvaluationResponse,
  news: NewsResponse,
  ocr: OcrResponse,
  summary: SummaryResponse,
  text: TextResponse,
};

const activeComponent = computed(
  () => templateMap[props.template] ?? TextResponse,
);

const imageSources = computed(() => {
  const sources: string[] = [];
  if (props.data?.heroImageUrl && isTrustedImageUrl(props.data.heroImageUrl))
    sources.push(encodeURI(props.data.heroImageUrl));

  props.data?.galleryItems?.forEach((item) => {
    if (item.imageUrl && isTrustedImageUrl(item.imageUrl))
      sources.push(encodeURI(item.imageUrl));
  });

  return sources;
});

function onImageClicked(item: GalleryItem) {
  if (!item.imageUrl || !isTrustedImageUrl(item.imageUrl)) return;
  emit('imageClicked', imageSources.value, encodeURI(item.imageUrl));
}

provide<HarnessImageClickedHandler>(harnessImageClickedKey, onImageClicked);
</script>

<template>
  <component :is="activeComponent" :data="data ?? {}" :text="text" />
</template>
