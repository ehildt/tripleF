<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import AsyncImage from '@/components/shared/ui/async-image/AsyncImage.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import { imageAltFor } from './helpers/image-alt-for.helper';
import { linkPropsFor } from './helpers/link-props-for.helper';
import { metaFor } from './helpers/meta-for.helper';
import type { RelatedStoryCardProps } from './RelatedStoryCard.types';

defineProps<RelatedStoryCardProps>();

const { t } = useI18n();
</script>

<template>
  <li class="related-story-card">
    <Tooltip :text="linkPropsFor(item).title ?? ''">
      <component
        :is="linkPropsFor(item).is"
        :href="linkPropsFor(item).href"
        :target="linkPropsFor(item).target"
        :rel="linkPropsFor(item).rel"
        class="related-story-card__link"
      >
        <figure>
          <div v-if="item.imageUrl" class="related-story-card__media">
            <AsyncImage
              :src="encodeURI(item.imageUrl)"
              :alt="imageAltFor(item) || t('common.relatedStoryImageFallback')"
            />
          </div>
          <figcaption
            v-if="item.title || item.url || metaFor(item)"
            class="related-story-card__caption"
          >
            <strong v-if="item.title">{{ item.title }}</strong>
            <strong v-else-if="item.url">{{ item.url }}</strong>
            <p v-if="metaFor(item)">{{ metaFor(item) }}</p>
          </figcaption>
        </figure>
      </component>
    </Tooltip>
  </li>
</template>

<style scoped>
.related-story-card {
  display: block !important;
  flex-wrap: nowrap !important;
  list-style: none;
  border: none !important;
  padding: 0 !important;
}

.related-story-card__link {
  display: block;
  height: 100%;
  color: inherit;
  text-decoration: none;
}

a.related-story-card__link:hover figure {
  border-color: var(--color-accent-border);
}

.related-story-card__link figure {
  margin: 0;
  border: 1px solid var(--color-divider);
  overflow: hidden;
  background: var(--color-bg-tertiary);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 240px;
  width: 100%;
  padding: 0 !important;
  transition: border-color 0.2s ease;
}

.related-story-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 180px;
  background: var(--color-bg-tertiary);
  display: block !important;
  flex-wrap: nowrap !important;
  border: none !important;
  padding: 0 !important;
  flex: 1 1 auto;
}

.related-story-card__caption {
  padding: var(--spacing-1-5) var(--spacing-2);
  font-size: 0.85em;
  color: var(--color-fg-muted);
}

.related-story-card__caption strong {
  display: block;
  color: var(--color-fg-primary);
  margin-bottom: 0.25em;
}

.related-story-card__caption p {
  margin: 0 0 0.5em;
  padding: 0 !important;
}
</style>
