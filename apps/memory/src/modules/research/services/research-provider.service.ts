import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  createBrightDataWebSearch,
  createSerperWebSearch,
  extractArticleText,
  fetchWithTimeout,
  SEARCH_TIMEOUT_MS,
  type ToolConfigSnapshot,
  type ToolDependencies,
} from '@triplef/agent/tools';

import { RESEARCH_CONFIG } from '../constants/research.constants.js';
import type { ResearchConfig } from '../models/research-config.model.js';

/** One normalized search result — the gap candidate shape. */
export interface ResearchSearchResult {
  url: string;
  title?: string;
  snippet: string;
}

/**
 * The researcher's web surface: search (Serper or Bright Data, per the
 * memory-side provider config) and fetch (key-less readability extraction).
 * The provider config is built fresh from the env-backed ResearchConfig so
 * the memory app can run a different provider than the server.
 */
@Injectable()
export class ResearchProviderService {
  private readonly logger = new Logger(ResearchProviderService.name);

  constructor(
    @Inject(RESEARCH_CONFIG) private readonly config: ResearchConfig,
  ) {}

  /** The tool-facing config snapshot — only the search providers are live. */
  private get snapshot(): ToolConfigSnapshot {
    const c = this.config;
    return {
      serper: {
        enabled: c.serper.enabled,
        apiKey: c.serper.apiKey,
        web: { enabled: c.serper.web.enabled, results: c.serper.web.results },
        images: { enabled: false, results: 0 },
        news: { enabled: false, results: 0 },
        places: { enabled: false, results: 0 },
        shopping: { enabled: false, results: 0 },
        reviews: { enabled: false, results: 0 },
        videos: { enabled: false, results: 0 },
        scrape: { enabled: false },
      },
      brightData: {
        enabled: c.brightData.enabled,
        apiKey: c.brightData.apiKey,
        serpZone: c.brightData.serpZone,
        web: {
          enabled: c.brightData.web.enabled,
          results: c.brightData.web.results,
        },
        images: { enabled: false, results: 0 },
        news: { enabled: false, results: 0 },
        places: { enabled: false, results: 0 },
        shopping: { enabled: false, results: 0 },
        videos: { enabled: false, results: 0 },
        scrape: { enabled: false },
      },
      sources: { preferred: [], blocked: [], imageTaskReferenceCount: 0 },
      youtube: {
        enabled: false,
        apiKey: undefined,
        videos: { enabled: false, results: 0 },
      },
      eodhd: {
        enabled: false,
        apiKey: undefined,
        search: { enabled: false, results: 0 },
        quote: { enabled: false, results: 0 },
        history: { enabled: false, results: 0 },
        technical: { enabled: false, results: 0 },
        intraday: { enabled: false, results: 0 },
        news: { enabled: false, results: 0 },
        fundamentals: { enabled: false, results: 0 },
      },
    };
  }

  private deps(): ToolDependencies {
    return { getLiveConfig: () => this.snapshot, logger: this.logger };
  }

  /**
   * One web search through the configured provider. Degrades to an empty
   * result when the provider is disabled or returns nothing — the research
   * job treats an empty search as "no new gaps", never a failure.
   */
  async search(query: string): Promise<ResearchSearchResult[]> {
    const tool =
      this.config.provider === 'bright-data'
        ? createBrightDataWebSearch(this.deps())
        : createSerperWebSearch(this.deps());
    // Direct invocation of our own tool — the ai-sdk Tool.execute signature
    // carries a second options arg the harness supplies; we call the input
    // shape directly.
    const execute = tool.execute as unknown as (input: {
      query: string;
    }) => Promise<unknown>;
    const result = (await execute({ query })) as
      | { results?: Array<{ url: string; title?: string; snippet: string }> }
      | undefined;
    if (!result?.results?.length) return [];
    return result.results.map((entry) => ({
      url: entry.url,
      title: entry.title,
      snippet: entry.snippet ?? '',
    }));
  }

  /**
   * Fetch one page as structural Markdown (readability + turndown) — the same
   * extraction the web-fetch tool uses. Empty content on non-article pages or
   * fetch failures; the caller skips empty pages.
   */
  async fetch(url: string): Promise<{ url: string; content: string }> {
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TriplefBot/1.0)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      },
      { timeoutMs: SEARCH_TIMEOUT_MS },
    );
    const html = await response.text();
    return { url, content: extractArticleText(html) };
  }
}
