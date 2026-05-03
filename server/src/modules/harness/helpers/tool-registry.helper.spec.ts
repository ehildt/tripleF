import { describe, expect, it } from 'vitest';

import {
  categorizeTools,
  expandToolAliases,
  getEnabledToolNames,
  type ProviderConfig,
  TOOL_NAMES,
} from './tool-registry.helper.js';

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
    webpageFetch: { enabled: true },
  },
  brave: {
    enabled: true,
    apiKey: 'brave-key',
    web: { enabled: true },
    images: { enabled: true },
    news: { enabled: true },
    video: { enabled: true },
  },
  searxng: { enabled: true, url: 'http://searxng' },
  browserBase: {
    enabled: true,
    apiKey: 'browserbase-key',
    search: { enabled: true },
    fetch: { enabled: true },
  },
};

describe('tool-registry.helper', () => {
  describe('categorizeTools', () => {
    it('groups tools by functional category', () => {
      const groups = categorizeTools(TOOL_NAMES);

      expect(groups.webSearch).toContain('webSearch');
      expect(groups.webSearch).toContain('serperWebSearch');
      expect(groups.imageSearch).toContain('serperImageSearch');
      expect(groups.imageSearch).toContain('braveImageSearch');
      expect(groups.newsSearch).toContain('serperNewsSearch');
      expect(groups.videoSearch).toContain('serperVideoSearch');
      expect(groups.webpageFetch).toContain('webFetch');
      expect(groups.imageVariants).toContain('requestGrayscale');
      expect(groups.specialized).toContain('wikipediaSearch');
    });
  });

  describe('getEnabledToolNames', () => {
    it('includes only tools whose providers are enabled and configured', () => {
      const enabled = getEnabledToolNames(fullConfig);

      expect(enabled).toContain('webSearch');
      expect(enabled).toContain('serperWebSearch');
      expect(enabled).toContain('serperImageSearch');
      expect(enabled).toContain('braveImageSearch');
      expect(enabled).toContain('searxngSearch');
      expect(enabled).toContain('browserbaseSearch');
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

    it('excludes brave tools when the api key is missing', () => {
      const enabled = getEnabledToolNames({
        ...fullConfig,
        brave: { ...fullConfig.brave, apiKey: undefined },
      });

      expect(enabled).not.toContain('braveWebSearch');
      expect(enabled).not.toContain('braveImageSearch');
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
      expect(expanded).toContain('braveImageSearch');
      expect(expanded).toContain('serperNewsSearch');
      expect(expanded).toContain('braveNewsSearch');
      expect(expanded).not.toContain('imageSearch');
      expect(expanded).not.toContain('newsSearch');
    });

    it('does not include disabled tools when expanding aliases', () => {
      const enabled = getEnabledToolNames({
        ...fullConfig,
        brave: { ...fullConfig.brave, enabled: false },
      });
      const expanded = expandToolAliases(['imageSearch'], enabled);

      expect(expanded).toContain('serperImageSearch');
      expect(expanded).not.toContain('braveImageSearch');
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
