import { describe, expect, it } from 'vitest';

import { POPUP_ANCHOR_STYLES } from '@/components/widgets/popup-anchor-styles.constant';

import { POPOUT_ANCHORS } from '../popout-settings.constant';
import { parsePopoutAnchor } from './parse-popout-anchor.helper';

describe('parsePopoutAnchor', () => {
  it.each(POPOUT_ANCHORS)('preserves the supported %s anchor', (anchor) => {
    expect(parsePopoutAnchor(anchor)).toBe(anchor);
    expect(POPUP_ANCHOR_STYLES[anchor]).toBeDefined();
  });

  it('falls back to bottom-right for missing or invalid values', () => {
    expect(parsePopoutAnchor(null)).toBe('bottom-right');
    expect(parsePopoutAnchor('elsewhere')).toBe('bottom-right');
  });
});
