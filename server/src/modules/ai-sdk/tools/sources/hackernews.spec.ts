import { describe, expect, it, vi } from 'vitest';

import { createHackerNewsSearch } from './hackernews.js';
import {
  STANDALONE_QUERY_DESCRIPTION,
  STANDALONE_QUERY_TOOL_CLAUSE,
} from './standalone-query.constants.js';

describe('createHackerNewsSearch', () => {
  const stubDeps = () =>
    ({
      logger: { log: vi.fn(), warn: vi.fn() },
      getLiveConfig: () => ({}),
    }) as any;

  it('repeats the standalone-query clause in the tool description', () => {
    const tool = createHackerNewsSearch(stubDeps());
    expect(tool.description).toContain(STANDALONE_QUERY_TOOL_CLAUSE);
  });

  it('describes the query argument with the shared standalone-query contract', () => {
    const tool = createHackerNewsSearch(stubDeps());
    expect((tool.inputSchema as any).shape.query.description).toBe(
      STANDALONE_QUERY_DESCRIPTION,
    );
  });
});
