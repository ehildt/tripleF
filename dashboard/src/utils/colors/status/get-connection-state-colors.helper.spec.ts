import { describe, expect, it } from 'vitest';

import { getConnectionStateColors } from './get-connection-state-colors.helper';

describe('getConnectionStateColors', () => {
  it('maps connected state', () => {
    expect(getConnectionStateColors('connected').text).toBe(
      'text-connection-connected',
    );
  });

  it('maps disconnected state', () => {
    expect(getConnectionStateColors('disconnected').text).toBe(
      'text-connection-disconnected',
    );
  });

  it('maps error state', () => {
    expect(getConnectionStateColors('error').text).toBe(
      'text-connection-error',
    );
  });

  it('defaults for unknown state', () => {
    expect(getConnectionStateColors('unknown' as any).text).toBe(
      'text-connection-default',
    );
  });
});
