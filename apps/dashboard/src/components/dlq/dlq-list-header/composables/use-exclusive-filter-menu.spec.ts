import { describe, expect, it } from 'vitest';

import { useExclusiveFilterMenu } from './use-exclusive-filter-menu';

describe('useExclusiveFilterMenu', () => {
  it('starts with all menus closed', () => {
    const { isMenuOpen } = useExclusiveFilterMenu(['status', 'search']);
    expect(isMenuOpen('status')).toBe(false);
    expect(isMenuOpen('search')).toBe(false);
  });

  it('opens a single menu at a time', () => {
    const { isMenuOpen, toggleMenu } = useExclusiveFilterMenu([
      'status',
      'search',
    ]);
    toggleMenu('status');
    expect(isMenuOpen('status')).toBe(true);
    expect(isMenuOpen('search')).toBe(false);
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

  it('closeAllMenus closes every open menu and ignores unknown ids', () => {
    const { isMenuOpen, toggleMenu, closeAllMenus } = useExclusiveFilterMenu([
      'status',
      'search',
    ]);
    toggleMenu('status');
    toggleMenu('search');
    toggleMenu('unknown');
    closeAllMenus();
    expect(isMenuOpen('status')).toBe(false);
    expect(isMenuOpen('search')).toBe(false);
  });
});
