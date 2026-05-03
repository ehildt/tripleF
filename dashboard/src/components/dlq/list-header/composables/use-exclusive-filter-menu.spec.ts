import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useExclusiveFilterMenu } from './use-exclusive-filter-menu';

describe('useExclusiveFilterMenu', () => {
  it('starts with all menus closed', () => {
    const { isMenuOpen } = useExclusiveFilterMenu(ref(null), [
      'status',
      'queue',
      'search',
    ]);
    expect(isMenuOpen('status')).toBe(false);
    expect(isMenuOpen('queue')).toBe(false);
    expect(isMenuOpen('search')).toBe(false);
  });

  it('opens a single menu at a time', () => {
    const { isMenuOpen, toggleMenu } = useExclusiveFilterMenu(ref(null), [
      'status',
      'queue',
    ]);
    toggleMenu('status');
    expect(isMenuOpen('status')).toBe(true);
    expect(isMenuOpen('queue')).toBe(false);
  });

  it('switches from one open menu to another', () => {
    const { isMenuOpen, toggleMenu } = useExclusiveFilterMenu(ref(null), [
      'status',
      'queue',
    ]);
    toggleMenu('status');
    toggleMenu('queue');
    expect(isMenuOpen('status')).toBe(false);
    expect(isMenuOpen('queue')).toBe(true);
  });

  it('closes an open menu when toggled', () => {
    const { isMenuOpen, toggleMenu } = useExclusiveFilterMenu(ref(null), [
      'status',
    ]);
    toggleMenu('status');
    toggleMenu('status');
    expect(isMenuOpen('status')).toBe(false);
  });

  it('closeAllMenus closes every open menu', () => {
    const { isMenuOpen, toggleMenu, closeAllMenus } = useExclusiveFilterMenu(
      ref(null),
      ['status', 'queue', 'search'],
    );
    toggleMenu('status');
    toggleMenu('queue');
    closeAllMenus();
    expect(isMenuOpen('status')).toBe(false);
    expect(isMenuOpen('queue')).toBe(false);
  });
});
