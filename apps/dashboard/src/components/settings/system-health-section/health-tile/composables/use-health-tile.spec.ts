import { Brain, Cpu, Database } from '@lucide/vue';
import { describe, expect, it } from 'vitest';

import type { HealthTileProps } from '../HealthTile.types';
import { useHealthTile } from './use-health-tile';

function makeProps(overrides: Partial<HealthTileProps> = {}): HealthTileProps {
  return {
    name: 'ollama',
    status: 'up',
    loading: false,
    error: false,
    ...overrides,
  };
}

describe('useHealthTile', () => {
  it('treats up/ok as healthy and everything else as unhealthy', () => {
    expect(useHealthTile(makeProps({ status: 'up' })).isHealthy.value).toBe(
      true,
    );
    expect(useHealthTile(makeProps({ status: 'ok' })).isHealthy.value).toBe(
      true,
    );
    expect(useHealthTile(makeProps({ status: 'down' })).isHealthy.value).toBe(
      false,
    );
  });

  it('resolves the tile icon per health-check name', () => {
    expect(useHealthTile(makeProps({ name: 'ollama' })).Icon.value).toBe(Brain);
    expect(useHealthTile(makeProps({ name: 'postgres' })).Icon.value).toBe(
      Database,
    );
    expect(useHealthTile(makeProps({ name: 'memory_heap' })).Icon.value).toBe(
      Cpu,
    );
  });

  it('colors the border and status per loading/error/healthy state', () => {
    expect(useHealthTile(makeProps()).borderStyle.value).toEqual({
      borderColor: 'var(--color-accent-primary)',
    });
    expect(
      useHealthTile(makeProps({ loading: true })).borderStyle.value,
    ).toEqual({
      borderColor: 'var(--color-divider)',
    });
    expect(
      useHealthTile(makeProps({ error: true })).statusColorStyle.value,
    ).toEqual({
      color: 'var(--color-status-error)',
    });
    expect(
      useHealthTile(makeProps({ status: 'down' })).statusColorStyle.value,
    ).toEqual({
      color: 'var(--color-status-error)',
    });
  });

  it('renders ... while loading, ERR on error, else the status text', () => {
    expect(
      useHealthTile(makeProps({ loading: true })).displayStatus.value,
    ).toBe('...');
    expect(useHealthTile(makeProps({ error: true })).displayStatus.value).toBe(
      'ERR',
    );
    expect(
      useHealthTile(makeProps({ status: 'degraded' })).displayStatus.value,
    ).toBe('degraded');
  });
});
