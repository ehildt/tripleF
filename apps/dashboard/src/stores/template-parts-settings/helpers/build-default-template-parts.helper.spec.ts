import { describe, expect, it } from 'vitest';

import {
  TEMPLATE_NAMES,
  TEMPLATE_PARTS,
} from '../template-parts-settings.constant';
import { buildDefaultTemplateParts } from './build-default-template-parts.helper';

describe('buildDefaultTemplateParts', () => {
  it('returns a visibility entry for every template', () => {
    const parts = buildDefaultTemplateParts();
    expect(Object.keys(parts).sort()).toEqual([...TEMPLATE_NAMES].sort());
  });

  it('enables every defined part of every template', () => {
    const parts = buildDefaultTemplateParts();
    for (const template of TEMPLATE_NAMES) {
      expect(Object.keys(parts[template]).sort()).toEqual(
        TEMPLATE_PARTS[template].map((part) => part.id).sort(),
      );
      for (const value of Object.values(parts[template])) {
        expect(value).toBe(true);
      }
    }
  });

  it('yields an empty map for the part-less text template', () => {
    expect(buildDefaultTemplateParts().text).toEqual({});
  });
});
