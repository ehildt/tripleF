import {
  DEFAULT_TAB_MENU_SIDE,
  TAB_MENU_SIDES,
} from '../tab-menu-settings.constant';
import type { TabMenuSide } from '../tab-menu-settings.types';

/** Parse a persisted tab-menu edge without casts or storage access. */
export function parseTabMenuSide(saved: string | null): TabMenuSide {
  return TAB_MENU_SIDES.find((side) => side === saved) ?? DEFAULT_TAB_MENU_SIDE;
}
