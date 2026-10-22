import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SourceBudgetConfigService } from './source-budget-config.service.js';

describe('SourceBudgetConfigService', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the validated default budget when env is unset', () => {
    const service = new SourceBudgetConfigService();
    expect(service.config.sourceBudgetRatio).toBe(0.125);
    expect(service.config.referenceDocChars).toBe(100_000);
    expect(service.config.gatheredTotalChars).toBe(16_000);
  });

  it('returns validated env overrides', () => {
    vi.stubEnv('HARNESS_SOURCE_BUDGET_RATIO', '0.25');
    vi.stubEnv('HARNESS_GATHERED_TOTAL_CHARS', '8000');
    const service = new SourceBudgetConfigService();
    expect(service.config.sourceBudgetRatio).toBe(0.25);
    expect(service.config.gatheredTotalChars).toBe(8000);
  });

  it('rejects an out-of-range ratio', () => {
    vi.stubEnv('HARNESS_SOURCE_BUDGET_RATIO', '1.5');
    const service = new SourceBudgetConfigService();
    expect(() => service.config).toThrow(/Schema violation/);
  });
});
