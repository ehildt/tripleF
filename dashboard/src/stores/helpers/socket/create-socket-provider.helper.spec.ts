import { describe, expect, it, vi } from 'vitest';

import { createSocketProvider } from './create-socket-provider.helper';

describe('createSocketProvider', () => {
  const socketStore = {
    ensureSocketConnection: vi.fn().mockReturnValue({ connected: true }),
    connectedEvents: new Set(['harness']),
    connectedRooms: new Map([['harness', new Set(['room1'])]]),
    getConnectedEventsAndRooms: vi.fn().mockReturnValue(['harness::room1']),
    closeEvent: vi.fn(),
    closeRoom: vi.fn(),
  } as any;

  const debugStore = {
    trackRequest: vi.fn(),
    addSocketDebugEntry: vi.fn(),
  };

  const messageStore = {
    addMessage: vi.fn(),
    addPendingMessage: vi.fn(),
    updatePendingMessage: vi.fn(),
  };

  it('creates provider with mapped functions', () => {
    const provider = createSocketProvider(
      socketStore,
      debugStore,
      messageStore,
    );
    expect(provider.getSocket()).toEqual({ connected: true });
    expect(provider.connectedEvents.has('harness')).toBe(true);
    expect(provider.connectedRooms.get('harness')?.has('room1')).toBe(true);
  });
});
