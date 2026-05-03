import { describe, expect, it } from 'vitest';

import { HarnessCancellationService } from './harness-cancellation.service.js';

describe('HarnessCancellationService', () => {
  it('registers and returns an abort controller', () => {
    const service = new HarnessCancellationService();
    const controller = service.register('req-1');

    expect(controller).toBeInstanceOf(AbortController);
    expect(controller.signal.aborted).toBe(false);
    expect(service.isActive('req-1')).toBe(true);
  });

  it('overwrites an existing controller when registering the same requestId', () => {
    const service = new HarnessCancellationService();
    const first = service.register('req-1');
    const second = service.register('req-1');

    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
    expect(service.isActive('req-1')).toBe(true);
  });

  it('cancels an active request and reports it active no longer', () => {
    const service = new HarnessCancellationService();
    service.register('req-1');

    const cancelled = service.cancel('req-1', 'test-reason');

    expect(cancelled).toBe(true);
    expect(service.isActive('req-1')).toBe(false);
  });

  it('returns false when cancelling an unknown request', () => {
    const service = new HarnessCancellationService();

    expect(service.cancel('unknown')).toBe(false);
  });

  it('returns false when cancelling an already-aborted request', () => {
    const service = new HarnessCancellationService();
    service.register('req-1');
    service.cancel('req-1');

    expect(service.cancel('req-1')).toBe(false);
  });

  it('deregisters an active request quietly without logging an abort', () => {
    const service = new HarnessCancellationService();
    const controller = service.register('req-1');

    service.deregister('req-1', { quiet: true });

    expect(controller.signal.aborted).toBe(true);
    expect(service.isActive('req-1')).toBe(false);
    expect(controller.signal.reason).toBe('deregister-quiet');
  });

  it('deregisters an active request loudly with an error reason', () => {
    const service = new HarnessCancellationService();
    const controller = service.register('req-2');

    service.deregister('req-2');

    expect(controller.signal.aborted).toBe(true);
    expect(service.isActive('req-2')).toBe(false);
    expect(controller.signal.reason).toBeInstanceOf(Error);
  });
});
