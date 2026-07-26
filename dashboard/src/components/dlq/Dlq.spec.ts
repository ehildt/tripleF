import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import { ref } from 'vue';

vi.mock('../../../api/queries/use-dlq-query', () => ({
  useDlqQuery: () => ({
    data: ref(null),
    error: ref(null),
    isError: ref(false),
    refetch: vi.fn(),
  }),
}));
vi.mock('../../../api/queries/use-retry-dlq-mutation', () => ({
  useRetryDlqMutation: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('../../../api/queries/use-reinstate-selected-dlq-mutation', () => ({}));
vi.mock('../../../api/queries/use-delete-dlq-mutation', () => ({
  useDeleteDlqMutation: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('../../../api/queries/use-update-dlq-mutation', () => ({
  useUpdateDlqMutation: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../../../stores/socket', () => ({
  useSocketStore: () => ({
    ensureSocketConnection: vi.fn(),
    joinRoom: vi.fn(),
    listenToEvent: vi.fn(),
    connectedEvents: new Set<string>(),
    connectedRooms: new Map<string, Set<string>>(),
  }),
}));

import Dlq from './Dlq.vue';

let activePinia: ReturnType<typeof createPinia>;

function mountPanel(props?: Record<string, unknown>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return mount(
    Dlq as Component,
    {
      props: { models: [], ...props },
      global: {
        plugins: [activePinia, [VueQueryPlugin, { queryClient }]],
      },
    } as any,
  );
}

describe('Dlq', () => {
  beforeEach(() => {
    activePinia = createPinia();
    setActivePinia(activePinia);
  });

  it('renders the list header and the details body', () => {
    const wrapper = mountPanel();
    expect(wrapper.text()).toContain('Jobs');
    expect(wrapper.text()).toContain('Details');
  });

  it('renders the empty DLQ state when there are no entries', () => {
    const wrapper = mountPanel();
    expect(wrapper.text()).toContain('No failed jobs');
  });

  it('renders the select-a-job placeholder in the details body', () => {
    const wrapper = mountPanel();
    expect(wrapper.text()).toContain('Select a job');
  });
});
