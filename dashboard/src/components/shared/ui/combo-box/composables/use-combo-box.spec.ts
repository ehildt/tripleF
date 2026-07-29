import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import { useComboBox } from './use-combo-box';

vi.mock('@vueuse/core', () => ({
  onClickOutside: vi.fn(),
  onKeyStroke: vi.fn(),
}));

describe('useComboBox', () => {
  it('starts closed', () => {
    const { open } = useComboBox(ref(null), ref(null), vi.fn());
    expect(open.value).toBe(false);
  });

  it('opens on toggle and focuses the menu input', async () => {
    const input = { focus: vi.fn() } as unknown as HTMLInputElement;
    const { open, toggle } = useComboBox(ref(null), ref(input), vi.fn());

    await toggle();

    expect(open.value).toBe(true);
    await nextTick();
    expect(input.focus).toHaveBeenCalled();
  });

  it('emits the selected option and closes', async () => {
    const onSelect = vi.fn();
    const { open, toggle, select } = useComboBox(
      ref(null),
      ref(null),
      onSelect,
    );

    await toggle();
    select('room-1');

    expect(onSelect).toHaveBeenCalledWith('room-1');
    expect(open.value).toBe(false);
  });

  it('closes without selecting', async () => {
    const onSelect = vi.fn();
    const { open, toggle, close } = useComboBox(ref(null), ref(null), onSelect);

    await toggle();
    close();

    expect(open.value).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('registers click-outside and escape handlers', () => {
    useComboBox(ref(null), ref(null), vi.fn());
    expect(vi.mocked(onClickOutside)).toHaveBeenCalled();
    expect(vi.mocked(onKeyStroke)).toHaveBeenCalledWith(
      'Escape',
      expect.any(Function),
    );
  });
});
