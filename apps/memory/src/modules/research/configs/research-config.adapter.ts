import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { getNumberEnv } from '@triplef/helpers/get-number-env';

import type { ResearchConfig } from '../models/research-config.model.js';

/**
 * Env-backed research config. The provider keys are duplicated here (not
 * shared with the server) so the memory app can run a different search
 * provider than the server — e.g. Serper on the server, Bright Data here.
 */
export function ResearchConfigAdapter(env = process.env): ResearchConfig {
  return {
    enabled: getBooleanEnv(env.RESEARCH_ENABLED, false)!,
    searchEnabled: getBooleanEnv(env.RESEARCH_SEARCH_ENABLED, false)!,
    provider:
      env.RESEARCH_PROVIDER === 'bright-data' ? 'bright-data' : 'serper',
    model: env.RESEARCH_MODEL || undefined,
    gapLimit: getNumberEnv(env.RESEARCH_GAP_LIMIT, 10) as number,
    maxDepth: getNumberEnv(env.RESEARCH_MAX_DEPTH, 3) as number,
    fetchBudget: getNumberEnv(env.RESEARCH_FETCH_BUDGET, 5) as number,
    frictionLimit: getNumberEnv(env.RESEARCH_FRICTION_LIMIT, 5) as number,
    serper: {
      enabled: getBooleanEnv(env.SERPER_ENABLED, false)!,
      apiKey: env.SERPER_API_KEY || undefined,
      web: {
        enabled: getBooleanEnv(env.SERPER_WEB_ENABLED, true)!,
        results: getNumberEnv(env.SERPER_WEB_RESULTS, 10) as number,
      },
    },
    brightData: {
      enabled: getBooleanEnv(env.BRIGHT_DATA_ENABLED, false)!,
      apiKey: env.BRIGHT_DATA_API_KEY || undefined,
      serpZone: env.BRIGHT_DATA_SERP_ZONE || undefined,
      web: {
        enabled: getBooleanEnv(env.BRIGHT_DATA_WEB_ENABLED, true)!,
        results: getNumberEnv(env.BRIGHT_DATA_WEB_RESULTS, 10) as number,
      },
    },
  };
}
