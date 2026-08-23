import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useFrozenReadSnapshot } from './use-frozen-read-snapshot';

interface Row {
  id: string;
}

const rows: Row[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

function setup(readIds: string[]) {
  const liveReadIds = ref<string[]>(readIds);
  const items = ref<Row[]>(rows);
  const snapshot = useFrozenReadSnapshot<Row>({
    items,
    itemKey: (row) => row.id,
    isItemRead: (row) => liveReadIds.value.includes(row.id),
  });
  return { liveReadIds, items, ...snapshot };
}

describe('useFrozenReadSnapshot', () => {
  it('captures the read state at setup', () => {
    const { frozenReadKeys } = setup(['a', 'c']);
    expect(frozenReadKeys.value.has('a')).toBe(true);
    expect(frozenReadKeys.value.has('b')).toBe(false);
    expect(frozenReadKeys.value.has('c')).toBe(true);
  });

  it('stays frozen when the live read state changes', () => {
    const { frozenReadKeys, liveReadIds } = setup([]);
    liveReadIds.value = ['a', 'b'];
    expect(frozenReadKeys.value.size).toBe(0);
  });

  it('picks up the live read state on refresh', () => {
    const { frozenReadKeys, liveReadIds, refreshReadSnapshot } = setup([]);
    liveReadIds.value = ['b'];
    refreshReadSnapshot();
    expect(frozenReadKeys.value.has('b')).toBe(true);
    expect(frozenReadKeys.value.size).toBe(1);
  });

  it('treats items added after the snapshot as unread', () => {
    const { frozenReadKeys, items, liveReadIds, refreshReadSnapshot } = setup(
      [],
    );
    liveReadIds.value = ['a'];
    items.value = [...rows, { id: 'd' }];
    refreshReadSnapshot();
    expect(frozenReadKeys.value.has('a')).toBe(true);
    expect(frozenReadKeys.value.has('d')).toBe(false);
  });
});
