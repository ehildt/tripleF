import { describe, expect, it } from 'vitest';

import { TOOL_DESCRIPTIONS, TOOL_NAMES } from '../../../schemas/index.js';

import { formatToolAvailabilityCatalog, formatToolCatalog } from './tool-catalog.helper.js';

describe('formatToolCatalog', () => {
  it('returns an empty array when no tools are enabled', () => {
    expect(formatToolCatalog([])).toEqual([]);
  });

  it('groups tools by category and includes their descriptions', () => {
    const catalog = formatToolCatalog(['webSearch', 'serperWebSearch', 'serperImageSearch']);

    expect(catalog.some((line) => line.includes('webSearch:'))).toBe(true);
    expect(catalog.some((line) => line.includes('serperWebSearch:'))).toBe(true);
    expect(catalog.some((line) => line.includes('serperImageSearch:'))).toBe(true);
  });

  it('places unknown tools in the specialized category', () => {
    const catalog = formatToolCatalog(['customReferenceTool']);

    expect(
      catalog.some(
        (line) => line.includes('  specialized:') && catalog.includes(`    - customReferenceTool: No description`),
      ),
    ).toBe(true);
  });
});

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
