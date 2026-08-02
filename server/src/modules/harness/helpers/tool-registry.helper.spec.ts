import { describe, expect, it } from 'vitest';

import { categorizeTools } from './categorize-tools.helper.js';
import { expandToolAliases } from './expand-tool-aliases.helper.js';
import { getEnabledToolNames } from './get-enabled-tool-names.helper.js';
import { type ProviderConfig, TOOL_NAMES } from './tool-registry.constants.js';

const fullConfig: ProviderConfig = {
  serper: {
    enabled: true,
    apiKey: 'serper-key',
    web: { enabled: true },
    images: { enabled: true },
    news: { enabled: true },
    places: { enabled: true },
    shopping: { enabled: true },
    reviews: { enabled: true },
    videos: { enabled: true },
    scrape: { enabled: true },
  },
  youtube: {
    enabled: true,
    apiKey: 'youtube-key',
    videos: { enabled: true },
  },
  playwright: { enabled: false },
};

describe('tool-registry.helper', () => {
  describe('categorizeTools', () => {
    it('groups tools by functional category', () => {
      const groups = categorizeTools(TOOL_NAMES);

      expect(groups.webSearch).toContain('webSearch');
      expect(groups.webSearch).toContain('serperWebSearch');
      expect(groups.imageSearch).toContain('serperImageSearch');
      expect(groups.newsSearch).toContain('serperNewsSearch');
      expect(groups.videoSearch).toContain('serperVideoSearch');
      expect(groups.pageFetch).toContain('webFetch');
      expect(groups.imageVariants).toContain('requestGrayscale');
    });
  });

  describe('getEnabledToolNames', () => {
    it('includes only tools whose provider is enabled and configured', () => {
      const enabled = getEnabledToolNames(fullConfig);

      expect(enabled).toContain('webSearch');
      expect(enabled).toContain('serperWebSearch');
      expect(enabled).toContain('serperImageSearch');
      expect(enabled).toContain('webFetch');
    });

    it('excludes serper tools when serper is disabled', () => {
      const enabled = getEnabledToolNames({
        ...fullConfig,
        serper: { ...fullConfig.serper, enabled: false },
      });

      expect(enabled).not.toContain('serperWebSearch');
      expect(enabled).not.toContain('serperImageSearch');
    });

    it('excludes serper tools when the api key is missing', () => {
      const enabled = getEnabledToolNames({
        ...fullConfig,
        serper: { ...fullConfig.serper, apiKey: undefined },
      });

      expect(enabled).not.toContain('webSearch');
      expect(enabled).not.toContain('serperWebSearch');
      expect(enabled).not.toContain('serperImageSearch');
    });
  });

  describe('expandToolAliases', () => {
    it('keeps concrete enabled tool names unchanged', () => {
      const enabled = getEnabledToolNames(fullConfig);
      const expanded = expandToolAliases(
        ['webSearch', 'serperImageSearch'],
        enabled,
      );

      expect(expanded).toEqual(['webSearch', 'serperImageSearch']);
    });

    it('expands category aliases to enabled concrete tools', () => {
      const enabled = getEnabledToolNames(fullConfig);
      const expanded = expandToolAliases(
        ['imageSearch', 'newsSearch'],
        enabled,
      );

      expect(expanded).toContain('serperImageSearch');
      expect(expanded).toContain('serperNewsSearch');
      expect(expanded).not.toContain('imageSearch');
      expect(expanded).not.toContain('newsSearch');
    });

    it('does not include disabled tools when expanding aliases', () => {
      const enabled = getEnabledToolNames({
        ...fullConfig,
        serper: { ...fullConfig.serper, images: { enabled: false } },
      });
      const expanded = expandToolAliases(['imageSearch'], enabled);

      expect(expanded).not.toContain('serperImageSearch');
    });

    it('drops unknown tool names', () => {
      const enabled = getEnabledToolNames(fullConfig);
      const expanded = expandToolAliases(
        ['unknownTool', 'imageSearch'],
        enabled,
      );

      expect(expanded).not.toContain('unknownTool');
      expect(expanded).toContain('serperImageSearch');
    });

    it('deduplicates tools expanded from multiple aliases', () => {
      const enabled = getEnabledToolNames(fullConfig);
      const expanded = expandToolAliases(
        ['webSearch', 'webSearch', 'imageSearch'],
        enabled,
      );

      const unique = [...new Set(expanded)];
      expect(expanded.length).toBe(unique.length);
    });
  });
});
