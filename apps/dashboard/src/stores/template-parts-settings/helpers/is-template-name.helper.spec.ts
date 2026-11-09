import { describe, expect, it } from 'vitest';

import { TEMPLATE_NAMES } from '../template-parts-settings.constant';
import { isTemplateName } from './is-template-name.helper';

describe('isTemplateName', () => {
  it.each(TEMPLATE_NAMES)('accepts catalog template %s', (template) => {
    expect(isTemplateName(template)).toBe(true);
  });

  it.each(['', 'unknown', 'Article', 'constructor'])(
    'rejects non-catalog template %s',
    (template) => {
      expect(isTemplateName(template)).toBe(false);
    },
  );
});
