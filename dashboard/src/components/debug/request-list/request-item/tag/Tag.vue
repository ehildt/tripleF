<script lang="ts" setup>
import { getTagColorClasses } from '@/utils/colors/get-tag-color-classes.helper';

const props = defineProps<{
  variant: 'type' | 'direction' | 'status';
  value: string;
}>();

const colorClasses = getTagColorClasses(props.variant, props.value);
</script>

<template>
  <span
    class="text-[10px] px-1.5 py-0.5 font-mono uppercase"
    :class="[colorClasses.border, colorClasses.text, colorClasses.bg]"
  >
    {{ value }}
  </span>
</template>
