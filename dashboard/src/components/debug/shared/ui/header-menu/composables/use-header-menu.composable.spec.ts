import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import type { HeaderMenuProps } from '../HeaderMenu.types';
import { useHeaderMenu } from './use-header-menu.composable';

function makeProps(overrides: Partial<HeaderMenuProps> = {}): HeaderMenuProps {
  return reactive({
    filter: 'all',
    search: '',
    allCount: 5,
    httpCount: 2,
    socketCount: 3,
    hideRead: false,
    ...overrides,
  });
}

function makeEmit() {
  return vi.fn();
}

describe('useHeaderMenu', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('disables filters with no results', () => {
    const { disableAll, disableHttp, disableSocket } = useHeaderMenu(
      makeProps({ allCount: 0, httpCount: 0, socketCount: 0 }),
      makeEmit(),
    );
    expect(disableAll.value).toBe(true);
    expect(disableHttp.value).toBe(true);
    expect(disableSocket.value).toBe(true);
  });

  it('keeps filters enabled when results exist', () => {
    const { disableAll, disableHttp, disableSocket } = useHeaderMenu(
      makeProps(),
      makeEmit(),
    );
    expect(disableAll.value).toBe(false);
    expect(disableHttp.value).toBe(false);
    expect(disableSocket.value).toBe(false);
  });

  it('arms the clear and emits only on the second click', () => {
    const emit = makeEmit();
    const { clearArmed, handleClearClick } = useHeaderMenu(makeProps(), emit);

    handleClearClick();
    expect(clearArmed.value).toBe(true);
    expect(emit).not.toHaveBeenCalled();

    handleClearClick();
    expect(emit).toHaveBeenCalledWith('clear');
  });

  it('disarms the clear after 3 seconds', () => {
    const emit = makeEmit();
    const { clearArmed, handleClearClick } = useHeaderMenu(makeProps(), emit);

    handleClearClick();
    vi.advanceTimersByTime(3000);
    expect(clearArmed.value).toBe(false);
  });
});
