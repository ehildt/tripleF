import { describe, expect, it } from 'vitest';

import { TOOL_DESCRIPTIONS, TOOL_NAMES } from '../../../schemas/index.js';

import { formatToolAvailabilityCatalog } from './tool-catalog.helper.js';

describe('formatToolAvailabilityCatalog', () => {
  it('marks all known tools and flags enabled ones', () => {
    const catalog = formatToolAvailabilityCatalog(['webSearch', 'serperImageSearch']);

    expect(catalog.some((line) => line.includes('serperImageSearch: enabled=true'))).toBe(true);
    expect(catalog.some((line) => line.includes('serperNewsSearch: enabled=false'))).toBe(true);
    expect(
      catalog.some((line) => line.includes('serperImageSearch') && line.includes(TOOL_DESCRIPTIONS.serperImageSearch)),
    ).toBe(true);
  });

  it('marks every tool in TOOL_NAMES', () => {
    const catalog = formatToolAvailabilityCatalog([]);
    expect(catalog.length).toBeGreaterThan(TOOL_NAMES.length);
  });
});
