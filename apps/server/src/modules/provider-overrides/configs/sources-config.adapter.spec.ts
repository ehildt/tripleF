import { describe, expect, it } from 'vitest';

import {
  SourcesConfigAdapter,
  SourcesConfigSchema,
} from './sources-config.adapter.js';

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

describe('SourcesConfigSchema', () => {
  const validConfig = SourcesConfigAdapter({});

  it('accepts the adapter output', () => {
    expect(SourcesConfigSchema.safeParse(validConfig).success).toBe(true);
  });

  it('rejects an entry that is neither hostname, glob, nor regex', () => {
    const result = SourcesConfigSchema.safeParse({
      ...validConfig,
      preferred: ['not a hostname!'],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('preferred'))).toBe(
      true,
    );
  });

  it('rejects an invalid /regex/ entry', () => {
    const result = SourcesConfigSchema.safeParse({
      ...validConfig,
      blocked: ['/(unclosed/'],
    });
    expect(result.success).toBe(false);
  });

  it('normalizes casing and www prefixes, keeping globs', () => {
    const result = SourcesConfigSchema.safeParse({
      ...validConfig,
      preferred: ['WWW.Example.com'],
      blocked: ['*.Sub.Domain.org'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferred).toContain('example.com');
      expect(result.data.blocked).toContain('*.sub.domain.org');
    }
  });

  it('passes /regex/ entries through unchanged', () => {
    const result = SourcesConfigSchema.safeParse({
      ...validConfig,
      blocked: ['/^ads\\./'],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.blocked).toContain('/^ads\\./');
  });

  it.each([0, 6, 50])(
    'accepts imageTaskReferenceCount %s (bounds)',
    (count) => {
      expect(
        SourcesConfigSchema.safeParse({
          ...validConfig,
          imageTaskReferenceCount: count,
        }).success,
      ).toBe(true);
    },
  );

  it.each([-1, 51])(
    'rejects imageTaskReferenceCount %s (out of bounds)',
    (count) => {
      const result = SourcesConfigSchema.safeParse({
        ...validConfig,
        imageTaskReferenceCount: count,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) =>
          i.path.includes('imageTaskReferenceCount'),
        ),
      ).toBe(true);
    },
  );
});
