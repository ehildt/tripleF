import { Module } from '@nestjs/common';

import { ConfigFactoryModule } from './config-factory.module.ts';

@Module({})
class FakeConfigService {}

describe('ConfigFactoryModule', () => {
  // eslint-disable-next-line no-console
  const originalWarn = console.warn;

  beforeEach(() => {
    // eslint-disable-next-line no-console
    console.warn = vi.fn();
  });

  afterEach(() => {
    // eslint-disable-next-line no-console
    console.warn = originalWarn;
  });

  describe('forRoot', () => {
    it('returns a DynamicModule', () => {
      const module = ConfigFactoryModule.forRoot({});
      expect(module).toHaveProperty('module');
      expect(module).toHaveProperty('providers');
      expect(module).toHaveProperty('exports');
      expect(module).toHaveProperty('global');
    });

    it('exports the provided providers', () => {
      const module = ConfigFactoryModule.forRoot({
        providers: [FakeConfigService],
      });
      expect(module.exports).toContain(FakeConfigService);
    });

    it('sets global to true when specified', () => {
      const module = ConfigFactoryModule.forRoot({
        global: true,
        providers: [FakeConfigService],
      });
      expect(module.global).toBe(true);
    });

    it('sets global to false by default', () => {
      const module = ConfigFactoryModule.forRoot({
        providers: [FakeConfigService],
      });
      expect(module.global).toBe(false);
    });

    it('logs warning when no providers are registered', () => {
      ConfigFactoryModule.forRoot({});
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith('[ConfigFactoryModule] No providers registered.');
    });

    it('does not log warning when providers are provided', () => {
      ConfigFactoryModule.forRoot({
        providers: [FakeConfigService],
      });
      // eslint-disable-next-line no-console
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('includes providers in the module definition', () => {
      const module = ConfigFactoryModule.forRoot({
        providers: [FakeConfigService],
      });
      expect(module.providers).toContain(FakeConfigService);
    });

    it('has ConfigFactoryModule as the module class', () => {
      const module = ConfigFactoryModule.forRoot({});
      expect(module.module).toBe(ConfigFactoryModule);
    });
  });
});
