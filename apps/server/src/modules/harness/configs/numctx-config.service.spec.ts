import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NumCtxConfigService } from './numctx-config.service.js';

describe('NumCtxConfigService', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the validated default ladder when NUM_CTX is unset', () => {
    const service = new NumCtxConfigService();
    expect(service.config).toEqual([
      32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 5242880,
    ]);
  });

  it('returns the validated custom ladder from NUM_CTX', () => {
    vi.stubEnv('NUM_CTX', '4096, 8192');
    const service = new NumCtxConfigService();
    expect(service.config).toEqual([4096, 8192]);
  });
});
