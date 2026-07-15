<script setup lang="ts">
defineProps<{
  author?: string;
  publishDate?: string;
  readTime?: string;
}>();
</script>

<template>
  <div v-if="author || publishDate || readTime" class="meta">
    <span v-if="author">{{ author }}</span>
    <span v-if="publishDate">{{ publishDate }}</span>
    <span v-if="readTime">{{ readTime }}</span>
  </div>
</template>

<style scoped>
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em 0.75em;
  font-size: 0.78em;
  color: var(--color-fg-muted);
  margin-bottom: 0.75em;
}

.meta span:not(:last-child)::after {
  content: '';
  display: inline-block;
  width: 3px;
  height: 3px;
  background: var(--color-divider);
  margin-left: 0.75em;
  vertical-align: middle;
}
</style>
