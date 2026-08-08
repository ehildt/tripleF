import { describe, expect, it } from 'vitest';

import { SourcesConfigAdapter } from './sources-config.adapter.js';

describe('SourcesConfigAdapter', () => {
  it('returns the default lists when env is empty', () => {
    const config = SourcesConfigAdapter({});
    expect(config.preferred).toContain('youtube.com');
    expect(config.blocked).toContain('*.gstatic.com');
  });

  it('appends env values to the defaults', () => {
    const config = SourcesConfigAdapter({
      SOURCES_PREFERRED: 'example.com, other.org',
      SOURCES_BLOCKED: 'bad.com',
    });
    expect(config.preferred).toContain('example.com');
    expect(config.preferred).toContain('other.org');
    expect(config.blocked).toContain('bad.com');
  });

  it('dedupes and lowercases env values', () => {
    const config = SourcesConfigAdapter({
      SOURCES_PREFERRED: 'Example.com, example.com',
    });
    expect(config.preferred.filter((s) => s === 'example.com')).toHaveLength(1);
  });
});
