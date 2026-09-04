import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/chat' },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/components/chat/Chat.vue'),
    },
    {
      path: '/memory',
      name: 'memory',
      component: () => import('@/components/memory/Memory.vue'),
    },
    {
      path: '/dlq',
      name: 'dlq',
      component: () => import('@/components/dlq/Dlq.vue'),
    },
    {
      path: '/debug',
      name: 'debug',
      component: () =>
        import('@/components/app/app-main-content/debug-section/DebugSection.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () =>
        import('@/components/app/app-main-content/settings-view/SettingsView.vue'),
    },
  ],
});

export default router;
