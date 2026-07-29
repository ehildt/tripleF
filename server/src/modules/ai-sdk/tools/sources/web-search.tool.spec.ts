import { describe, expect, it, vi } from 'vitest';

import {
  STANDALONE_QUERY_DESCRIPTION,
  STANDALONE_QUERY_TOOL_CLAUSE,
} from './standalone-query.constants.js';
import { createWebSearch } from './web-search.tool.js';

describe('createWebSearch', () => {
  const stubDeps = () =>
    ({
      logger: { log: vi.fn(), warn: vi.fn() },
      getLiveConfig: () => ({
        serper: { enabled: false, web: { enabled: false } },
      }),
    }) as any;

  it('repeats the standalone-query clause in the tool description', () => {
    const tool = createWebSearch(stubDeps());
    expect(tool.description).toContain(STANDALONE_QUERY_TOOL_CLAUSE);
  });

  it('describes the query argument with the shared standalone-query contract', () => {
    const tool = createWebSearch(stubDeps());
    expect((tool.inputSchema as any).shape.query.description).toBe(
      STANDALONE_QUERY_DESCRIPTION,
    );
  });
});
