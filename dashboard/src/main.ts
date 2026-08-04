import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import router from './router/router';
import App from './App.vue';

const app = createApp(App);
app.use(VueQueryPlugin);
app.use(createPinia());
app.use(router);
app.mount('#app');
