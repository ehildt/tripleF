/** One search-provider endpoint config (web search only — research needs no other endpoints). */
interface ResearchProviderEndpointConfig {
  enabled: boolean;
  results: number;
}

/**
 * The gap-filling researcher's env-backed baseline. Every knob is
 * settings-overridable at runtime (see MemoryOverridesService) — the env
 * values here are the defaults the overrides layer on top of.
 */
export interface ResearchConfig {
  /** Master switch (RESEARCH_ENABLED, default false — off by default). */
  enabled: boolean;
  /** Search toggle (RESEARCH_SEARCH_ENABLED, default false). */
  searchEnabled: boolean;
  /** Which search provider the researcher uses (RESEARCH_PROVIDER). */
  provider: 'serper' | 'bright-data';
  /** Triage chat model (RESEARCH_MODEL) — no default; the job no-ops without one. */
  model?: string;
  /** Max gaps triaged per run (RESEARCH_GAP_LIMIT, default 10). */
  gapLimit: number;
  /** Max deep-dive depth per chain (RESEARCH_MAX_DEPTH, default 3). */
  maxDepth: number;
  /** Max pages fetched per run (RESEARCH_FETCH_BUDGET, default 5). */
  fetchBudget: number;
  /**
   * Max contested-memory frictions screened per run
   * (RESEARCH_FRICTION_LIMIT, default 5) — each checkable dispute adds one
   * resolution-seeking search to the run.
   */
  frictionLimit: number;
  serper: {
    enabled: boolean;
    apiKey?: string;
    web: ResearchProviderEndpointConfig;
  };
  brightData: {
    enabled: boolean;
    apiKey?: string;
    serpZone?: string;
    web: ResearchProviderEndpointConfig;
  };
}
