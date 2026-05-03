import { Test, TestingModule } from '@nestjs/testing';

import { SharpConfigService } from './sharp-config.service.js';

describe('SharpConfigService', () => {
  let service: SharpConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharpConfigService],
    }).compile();

    service = module.get<SharpConfigService>(SharpConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns valid defaults', () => {
    const defaults = service.defaults;

    expect(defaults.enabled).toBe(false);
    expect(defaults.resize.maxWidth).toBe(768);
    expect(defaults.variants.original).toBe(true);
    expect(defaults.parameters.blurSigma).toBe(0.5);
  });

  it('caches the defaults', () => {
    const first = service.defaults;
    const second = service.defaults;

    expect(first).toBe(second);
  });
});
