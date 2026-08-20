import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('loadTurndown', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('memoizes a single TurndownService instance across calls', async () => {
    const { loadTurndown: load } = await import('./load-turndown.helper');

    const first = await load();
    const second = await load();

    expect(first).toBe(second);
  });

  it('converts markdown to html-like text via the configured service', async () => {
    const { loadTurndown: load } = await import('./load-turndown.helper');
    const turndown = await load();

    // The heading/atx and fenced code styles configured at creation.
    expect(turndown.turndown('<h1>Title</h1>')).toBe('# Title');
    expect(turndown.turndown('<pre><code>code</code></pre>')).toBe(
      '```\ncode\n```',
    );
  });
});
