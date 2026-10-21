import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { useDlqLiveEvents } from './use-dlq-live-events';

const storeMocks = vi.hoisted(() => ({
  markDlqActivity: vi.fn(),
  applyUpsertedEntry: vi.fn(),
  applyRemovedEntries: vi.fn(),
  requestEntriesRefresh: vi.fn(),
}));

const { ensureSocketConnection } = vi.hoisted(() => ({
  ensureSocketConnection: vi.fn(),
}));

const appStoreMock = vi.hoisted(() => ({ activeTab: 'chat' }));

vi.mock('@/stores/dlq', () => ({
  useDlqStore: () => storeMocks,
}));

vi.mock('@/stores/socket', () => ({
  useSocketStore: () => ({ ensureSocketConnection }),
}));

vi.mock('@/stores/app', () => ({
  useAppStore: () => appStoreMock,
}));

/** Minimal consumer of the composable under test. */
const Probe = defineComponent({
  setup() {
    useDlqLiveEvents();
    return () => h('div');
  },
});

/** Fake socket that records listeners and lets the test emit into them. */
function makeSocket() {
  const handlers: Record<string, (payload: unknown) => void> = {};
  return {
    on: vi.fn((event: string, handler: (payload: unknown) => void) => {
      handlers[event] = handler;
    }),
    off: vi.fn((event: string) => {
      delete handlers[event];
    }),
    emit(event: string, payload: unknown) {
      handlers[event]?.(payload);
    },
  };
}

const envelope = (type: string, data: unknown) => ({
  v: 1,
  kind: 'event',
  type,
  id: 'e1',
  at: '2026-01-15T09:30:00.000Z',
  data,
});

describe('useDlqLiveEvents', () => {
  let socket: ReturnType<typeof makeSocket>;

  beforeEach(() => {
    setActivePinia(createPinia());
    socket = makeSocket();
    ensureSocketConnection.mockReset().mockReturnValue(socket);
    Object.values(storeMocks).forEach((fn) => fn.mockClear());
    appStoreMock.activeTab = 'chat';
  });

  it('attaches listeners for the three DLQ topics on mount', () => {
    mount(Probe);
    expect(socket.on).toHaveBeenCalledWith(
      'dlq:entry-upserted',
      expect.any(Function),
    );
    expect(socket.on).toHaveBeenCalledWith(
      'dlq:entries-removed',
      expect.any(Function),
    );
    expect(socket.on).toHaveBeenCalledWith(
      'dlq:bulk-changed',
      expect.any(Function),
    );
  });

  it('applies an upserted entry and lights the activity dot', () => {
    mount(Probe);
    const entry = { id: 'rec-1' };
    socket.emit(
      'dlq:entry-upserted',
      envelope('dlq:entry-upserted', { entry }),
    );
    expect(storeMocks.markDlqActivity).toHaveBeenCalledTimes(1);
    expect(storeMocks.applyUpsertedEntry).toHaveBeenCalledWith(entry);
  });

  it('drops an upserted envelope without an entry', () => {
    mount(Probe);
    socket.emit('dlq:entry-upserted', envelope('dlq:entry-upserted', {}));
    expect(storeMocks.markDlqActivity).not.toHaveBeenCalled();
    expect(storeMocks.applyUpsertedEntry).not.toHaveBeenCalled();
  });

  it('applies removed ids and lights the activity dot', () => {
    mount(Probe);
    socket.emit(
      'dlq:entries-removed',
      envelope('dlq:entries-removed', { ids: ['rec-1'] }),
    );
    expect(storeMocks.markDlqActivity).toHaveBeenCalledTimes(1);
    expect(storeMocks.applyRemovedEntries).toHaveBeenCalledWith(['rec-1']);
  });

  it('requests a refetch on bulk change only while the dlq tab is open', () => {
    mount(Probe);
    socket.emit('dlq:bulk-changed', envelope('dlq:bulk-changed', {}));
    expect(storeMocks.markDlqActivity).toHaveBeenCalledTimes(1);
    expect(storeMocks.requestEntriesRefresh).not.toHaveBeenCalled();

    appStoreMock.activeTab = 'dlq';
    socket.emit('dlq:bulk-changed', envelope('dlq:bulk-changed', {}));
    expect(storeMocks.requestEntriesRefresh).toHaveBeenCalledTimes(1);
  });

  it('ignores a malformed payload', () => {
    mount(Probe);
    socket.emit('dlq:entry-upserted', { not: 'an envelope' });
    expect(storeMocks.markDlqActivity).not.toHaveBeenCalled();
  });

  it('ignores an envelope with a different type', () => {
    mount(Probe);
    socket.emit(
      'dlq:entry-upserted',
      envelope('other:event', { entry: { id: 'x' } }),
    );
    expect(storeMocks.markDlqActivity).not.toHaveBeenCalled();
  });

  it('detaches the listeners on unmount', () => {
    const wrapper = mount(Probe);
    wrapper.unmount();
    expect(socket.off).toHaveBeenCalledWith(
      'dlq:entry-upserted',
      expect.any(Function),
    );
    expect(socket.off).toHaveBeenCalledWith(
      'dlq:entries-removed',
      expect.any(Function),
    );
    expect(socket.off).toHaveBeenCalledWith(
      'dlq:bulk-changed',
      expect.any(Function),
    );
  });
});
