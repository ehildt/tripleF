import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { useDlqActivityEvents } from './use-dlq-activity-events';

const { markDlqActivity } = vi.hoisted(() => ({
  markDlqActivity: vi.fn(),
}));

const { ensureSocketConnection } = vi.hoisted(() => ({
  ensureSocketConnection: vi.fn(),
}));

vi.mock('@/stores/dlq', () => ({
  useDlqStore: () => ({ markDlqActivity }),
}));

vi.mock('@/stores/socket', () => ({
  useSocketStore: () => ({ ensureSocketConnection }),
}));

/** Minimal consumer of the composable under test. */
const Probe = defineComponent({
  setup() {
    useDlqActivityEvents();
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

const validEnvelope = {
  v: 1,
  kind: 'event',
  type: 'dlq:changed',
  id: 'e1',
  at: '2026-01-15T09:30:00.000Z',
  data: {},
};

describe('useDlqActivityEvents', () => {
  let socket: ReturnType<typeof makeSocket>;

  beforeEach(() => {
    setActivePinia(createPinia());
    socket = makeSocket();
    ensureSocketConnection.mockReset().mockReturnValue(socket);
    markDlqActivity.mockClear();
  });

  it('attaches a dlq:changed listener on mount', () => {
    mount(Probe);
    expect(socket.on).toHaveBeenCalledWith('dlq:changed', expect.any(Function));
  });

  it('flags the store when a valid dlq:changed envelope arrives', () => {
    mount(Probe);
    socket.emit('dlq:changed', validEnvelope);
    expect(markDlqActivity).toHaveBeenCalledTimes(1);
  });

  it('ignores a malformed payload', () => {
    mount(Probe);
    socket.emit('dlq:changed', { not: 'an envelope' });
    expect(markDlqActivity).not.toHaveBeenCalled();
  });

  it('ignores an envelope with a different type', () => {
    mount(Probe);
    socket.emit('dlq:changed', { ...validEnvelope, type: 'other:event' });
    expect(markDlqActivity).not.toHaveBeenCalled();
  });

  it('detaches the listener on unmount', () => {
    const wrapper = mount(Probe);
    wrapper.unmount();
    expect(socket.off).toHaveBeenCalledWith(
      'dlq:changed',
      expect.any(Function),
    );
  });
});
