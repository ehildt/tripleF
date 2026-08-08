<script setup lang="ts">
import SectionTitle from '../../shared/ui/section-title/SectionTitle.vue';

defineProps<{
  title?: string;
  content?: string;
}>();
</script>

<template>
  <section v-if="content" class="content">
    <SectionTitle v-if="title" :title="title" />
    <p>{{ content }}</p>
  </section>
</template>

<style scoped>
.content p {
  line-height: 1.65;
  white-space: pre-line;
  background-color: var(--color-bg-tertiary);
  padding: var(--spacing-3);
}
</style>
