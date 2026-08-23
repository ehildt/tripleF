import { describe, expect, it } from 'vitest';

import { useExclusiveMenu } from './use-exclusive-menu';

describe('useExclusiveMenu', () => {
  it('starts with all menus closed', () => {
    const { isMenuOpen } = useExclusiveMenu();
    expect(isMenuOpen('model').value).toBe(false);
    expect(isMenuOpen('stream').value).toBe(false);
    expect(isMenuOpen('conversations').value).toBe(false);
  });

  it('opens a menu via toggleMenu', () => {
    const { isMenuOpen, toggleMenu } = useExclusiveMenu();
    toggleMenu('model');
    expect(isMenuOpen('model').value).toBe(true);
    expect(isMenuOpen('stream').value).toBe(false);
  });

  it('closes the same menu via toggleMenu', () => {
    const { isMenuOpen, toggleMenu } = useExclusiveMenu();
    toggleMenu('model');
    expect(isMenuOpen('model').value).toBe(true);
    toggleMenu('model');
    expect(isMenuOpen('model').value).toBe(false);
  });

  it('only allows one menu open at a time', () => {
    const { isMenuOpen, toggleMenu } = useExclusiveMenu();
    toggleMenu('model');
    expect(isMenuOpen('model').value).toBe(true);
    toggleMenu('stream');
    expect(isMenuOpen('model').value).toBe(false);
    expect(isMenuOpen('stream').value).toBe(true);
    toggleMenu('conversations');
    expect(isMenuOpen('stream').value).toBe(false);
    expect(isMenuOpen('conversations').value).toBe(true);
  });

  it('closeAllMenus closes the currently open menu', () => {
    const { isMenuOpen, toggleMenu, closeAllMenus } = useExclusiveMenu();
    toggleMenu('model');
    expect(isMenuOpen('model').value).toBe(true);
    closeAllMenus();
    expect(isMenuOpen('model').value).toBe(false);
  });

  it('closeAllMenus is a no-op when no menu is open', () => {
    const { openMenuKey, closeAllMenus } = useExclusiveMenu();
    closeAllMenus();
    expect(openMenuKey.value).toBeNull();
  });

  it('openMenu forces a specific menu open', () => {
    const { isMenuOpen, openMenu } = useExclusiveMenu();
    openMenu('stream');
    expect(isMenuOpen('stream').value).toBe(true);
    expect(isMenuOpen('model').value).toBe(false);
  });

  it('openMenu replaces the currently open menu', () => {
    const { isMenuOpen, toggleMenu, openMenu } = useExclusiveMenu();
    toggleMenu('model');
    expect(isMenuOpen('model').value).toBe(true);
    openMenu('stream');
    expect(isMenuOpen('model').value).toBe(false);
    expect(isMenuOpen('stream').value).toBe(true);
  });
});
