import type { Preview } from '@storybook/vue3-vite';
import { QueryClient } from '@tanstack/vue-query';
import { createPinia, setActivePinia } from 'pinia';
import { defineComponent, getCurrentInstance, h, provide } from 'vue';

import { i18n } from '../src/i18n/i18n';
import StoryContainer from './StoryContainer.vue';

import '../src/assets/css/style.css';

/**
 * Single shared QueryClient for all stories. `retry: false` and
 * `enabled: false` so that nothing actually fires a network call by
 * accident — stories that need a populated query mock the result on the
 * component itself (e.g. by intercepting `useDlqQuery`).
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, enabled: false },
  },
});

const piniaDecorator = (story) => {
  setActivePinia(createPinia());
  return story();
};

/**
 * `useQuery` / `useQueryClient` look up the client via `inject` against
 * the symbol `VUE_QUERY_CLIENT`. We provide it on a tiny wrapper
 * component so DLQ / other stories that hit `@tanstack/vue-query`
 * during setup don't throw "No 'queryClient' found in Vue context".
 */
const vueQueryDecorator = (story) => {
  const Wrapper = defineComponent({
    setup() {
      provide('VUE_QUERY_CLIENT', queryClient);
      return () => h('div', null, [h(story())]);
    },
  });
  return () => h(Wrapper);
};

const storyContainerDecorator = (story, { parameters }) => {
  const layout = parameters?.layout;
  const padded = layout !== 'fullscreen';
  const centered = layout !== 'fullscreen';
  return () => h(StoryContainer, { padded, centered }, () => h(story()));
};

/**
 * Install the app's i18n plugin on the story's app instance so components
 * that call `useI18n()` / `t()` in script setup render in stories (the
 * tooltip rows, tab labels, etc.). `app.use` during a descendant's setup
 * works because the plugin only provides root-level state, and the story
 * tree mounts after this wrapper's setup runs.
 */
const i18nDecorator = (story) => {
  const Wrapper = defineComponent({
    setup() {
      const app = getCurrentInstance()?.appContext.app;
      if (app && !(app as unknown as { _i18n?: unknown })._i18n) {
        app.use(i18n);
      }
      return () => h('div', [h(story())]);
    },
  });
  return () => h(Wrapper);
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: 'todo',
    },
  },

  initialGlobals: {
    darkMode: true,
  },

  globalTypes: {
    theme: {
      name: 'Theme',
      defaultValue: 'souls',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'souls', title: 'Dark Souls' },
          { value: 'nioh', title: 'Nioh' },
          { value: 'residentevil', title: 'Resident Evil' },
          { value: 'gothic', title: 'Gothic' },
          { value: 'wukong', title: 'Wukong' },
          { value: 'ghostwire', title: 'Ghostwire Tokyo' },
          { value: 'cyberpunk', title: 'Cyberpunk 2077' },
          { value: 'yakuza', title: 'Yakuza' },
          { value: 'pragmata', title: 'Pragmata' },
          { value: 'baldursgate', title: "Baldur's Gate" },
          { value: 'deathspace', title: 'Dead Space' },
          { value: 'stellar', title: 'Stellar Blade' },
          { value: 'wuchang', title: 'Wuchang' },
        ],
      },
    },
  },

  decorators: [
    (story, { globals: { theme = 'souls', darkMode = true } }) => {
      document.documentElement.setAttribute('data-theme', theme as string);
      document.documentElement.setAttribute(
        'data-theme-mode',
        darkMode ? 'dark' : 'light',
      );
      return story();
    },
    storyContainerDecorator,
    piniaDecorator,
    vueQueryDecorator,
    i18nDecorator,
  ],
};

export default preview;
