/**
 * Smoke test: mount the Dlq orchestrator exactly the way its story
 * does, and assert that it renders without throwing.
 *
 * Regression: Dlq.stories.ts used to render with no Pinia /
 * VueQueryPlugin context, so `useDlqQuery()` threw "No 'queryClient'
 * found in Vue context", setup() aborted, and the template tried to
 * read `dlqStore.selectedEntry` against an undefined `dlqStore`,
 * producing "Cannot read properties of undefined (reading
 * 'selectedEntry')".
 */
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, provide, ref } from 'vue';

import Dlq from './Dlq.vue';

vi.mock('../../api/queries/use-dlq-query', () => ({
  useDlqQuery: () => ({
    data: ref(null),
    error: ref(null),
    isError: ref(false),
    refetch: vi.fn(),
  }),
}));
vi.mock('../../api/queries/use-retry-dlq-mutation', () => ({
  useRetryDlqMutation: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('../../api/queries/use-reinstate-selected-dlq-mutation', () => ({}));
vi.mock('../../api/queries/use-delete-dlq-mutation', () => ({
  useDeleteDlqMutation: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('../../api/queries/use-update-dlq-mutation', () => ({
  useUpdateDlqMutation: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../../stores/socket', () => ({
  useSocketStore: () => ({
    ensureSocketConnection: vi.fn(),
    joinRoom: vi.fn(),
    listenToEvent: vi.fn(),
    connectedEvents: new Set<string>(),
    connectedRooms: new Map<string, Set<string>>(),
  }),
}));

import { appViewContextKey } from '../../composables/use-app-view-context';
import { mockAppViewContext } from '../../test-utils/mock-app-view-context';

function mountWithAppContext(component: any, props: Record<string, unknown>) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, enabled: false } },
  });

  const AppShell = defineComponent({
    setup() {
      provide('VUE_QUERY_CLIENT', queryClient);
      provide(
        appViewContextKey,
        mockAppViewContext({ viewModels: (props.models as string[]) ?? [] }),
      );
      return () => h('div', null, [h(component, props)]);
    },
  });

  return mount(AppShell, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  });
}

describe('Dlq story smoke', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without throwing (regression: useDlqQuery needs VueQueryPlugin)', () => {
    const wrapper = mountWithAppContext(Dlq, { models: ['llama3'] });
    expect(wrapper.text()).toContain('Jobs');
    expect(wrapper.text()).toContain('Details');
    expect(wrapper.text()).toContain('No failed jobs');
  });
});
