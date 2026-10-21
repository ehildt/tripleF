import { describe, expect, it } from 'vitest';

import { useExclusiveFilterMenu } from './use-exclusive-filter-menu';

describe('useExclusiveFilterMenu', () => {
  it('starts with all menus closed', () => {
    const { isMenuOpen, isAnyMenuOpen } = useExclusiveFilterMenu([
      'status',
      'search',
    ]);
    expect(isMenuOpen('status')).toBe(false);
    expect(isMenuOpen('search')).toBe(false);
    expect(isAnyMenuOpen.value).toBe(false);
  });

  it('opens a single menu at a time', () => {
    const { isMenuOpen, isAnyMenuOpen, toggleMenu } = useExclusiveFilterMenu([
      'status',
      'search',
    ]);
    toggleMenu('status');
    expect(isMenuOpen('status')).toBe(true);
    expect(isMenuOpen('search')).toBe(false);
    expect(isAnyMenuOpen.value).toBe(true);
  });

  it('switches from one open menu to another', () => {
    const { isMenuOpen, toggleMenu } = useExclusiveFilterMenu([
      'status',
      'search',
    ]);
    toggleMenu('status');
    toggleMenu('search');
    expect(isMenuOpen('status')).toBe(false);
    expect(isMenuOpen('search')).toBe(true);
  });

  it('closes an open menu when toggled', () => {
    const { isMenuOpen, toggleMenu } = useExclusiveFilterMenu(['status']);
    toggleMenu('status');
    toggleMenu('status');
    expect(isMenuOpen('status')).toBe(false);
  });

  it('closeAllMenus closes every open menu', () => {
    const { isMenuOpen, isAnyMenuOpen, toggleMenu, closeAllMenus } =
      useExclusiveFilterMenu(['status', 'search']);
    toggleMenu('status');
    toggleMenu('search');
    closeAllMenus();
    expect(isMenuOpen('status')).toBe(false);
    expect(isMenuOpen('search')).toBe(false);
    expect(isAnyMenuOpen.value).toBe(false);
  });
});
