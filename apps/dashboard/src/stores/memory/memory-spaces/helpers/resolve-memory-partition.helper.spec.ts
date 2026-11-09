import { describe, expect, it } from 'vitest';

import { resolveMemoryPartition } from './resolve-memory-partition.helper';

describe('resolveMemoryPartition', () => {
  it('prefers the current key, including its explicit empty value', () => {
    expect(resolveMemoryPartition(' work ', 'legacy')).toBe('work');
    expect(resolveMemoryPartition('', 'legacy')).toBe('');
  });

  it('uses a trimmed legacy value or the default', () => {
    expect(resolveMemoryPartition(null, ' legacy ')).toBe('legacy');
    expect(resolveMemoryPartition(null, ' ')).toBe('default');
    expect(resolveMemoryPartition(null, null)).toBe('default');
  });
});
