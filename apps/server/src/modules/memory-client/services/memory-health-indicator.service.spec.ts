import { describe, expect, it, vi } from 'vitest';

import { MemoryHealthIndicator } from './memory-health-indicator.service.js';

const indicator = () => ({
  up: vi.fn().mockReturnValue({ memory: { status: 'up' } }),
  down: vi.fn((details: Record<string, unknown>) => ({
    memory: { status: 'down', ...details },
  })),
});

const healthIndicatorService = (check: ReturnType<typeof indicator>) => ({
  check: vi.fn().mockReturnValue(check),
});

describe('MemoryHealthIndicator', () => {
  it('reports up when the memory status probe succeeds', async () => {
    const check = indicator();
    const service = new MemoryHealthIndicator(
      healthIndicatorService(check) as never,
      { status: vi.fn().mockResolvedValue({ status: 'green' }) } as never,
    );

    await expect(service.check('memory')).resolves.toEqual({
      memory: { status: 'up' },
    });
    expect(check.down).not.toHaveBeenCalled();
  });

  it('reports down with the failure message when the probe throws', async () => {
    const check = indicator();
    const service = new MemoryHealthIndicator(
      healthIndicatorService(check) as never,
      {
        status: vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED')),
      } as never,
    );

    await expect(service.check('memory')).resolves.toEqual({
      memory: { status: 'down', message: 'Error: connect ECONNREFUSED' },
    });
  });

  it('keys the indicator by the caller-provided name', async () => {
    const check = indicator();
    const health = healthIndicatorService(check);
    const service = new MemoryHealthIndicator(
      health as never,
      {
        status: vi.fn().mockResolvedValue({}),
      } as never,
    );

    await service.check('outbound-memory');

    expect(health.check).toHaveBeenCalledWith('outbound-memory');
  });
});
