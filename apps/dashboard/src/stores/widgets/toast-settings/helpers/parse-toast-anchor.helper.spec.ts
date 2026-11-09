import { describe, expect, it } from 'vitest';

import { TOAST_ANCHORS } from '../toast-settings.constant';
import { parseToastAnchor } from './parse-toast-anchor.helper';

describe('parseToastAnchor', () => {
  it.each(TOAST_ANCHORS)('accepts %s', (anchor) => {
    expect(parseToastAnchor(anchor)).toBe(anchor);
  });

  it.each([null, '', 'center', 'TOP-LEFT'])(
    'falls back to bottom-right for invalid value %s',
    (saved) => {
      expect(parseToastAnchor(saved)).toBe('bottom-right');
    },
  );
});
