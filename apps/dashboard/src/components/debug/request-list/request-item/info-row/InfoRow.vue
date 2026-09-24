<script lang="ts" setup>
import Endpoint from './endpoint/Endpoint.vue';
import Id from './id/Id.vue';
import Method from './method/Method.vue';
import Model from './model/Model.vue';
import type { InfoRowProps } from './InfoRow.types';

const props = defineProps<InfoRowProps>();
</script>

<template>
  <Method :method="props.method" :is-boxed="props.type === 'http'" />

  <Id
    v-if="props.requestId"
    :id="props.requestId"
    :show-icon="props.type === 'socket'"
  />

  <Endpoint v-if="props.endpoint" :endpoint="props.endpoint" />
  <Model v-if="props.model" :model="props.model" />
</template>
