import {
  DiskHealthIndicator,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';

import { AppConfigService } from '../configs/app-config.service.js';
import { OllamaConfigService } from '../configs/ollama-config.service.js';

import { HealthService } from './health.service.js';
import { PostgresService } from './postgres.service.js';
import { PostgresHealthIndicator } from './postgres-health-indicator.service.js';

describe('HealthService', () => {
  let service: HealthService;
  let healthCheckService: HealthCheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        PostgresHealthIndicator,
        {
          provide: PostgresService,
          useValue: {
            ping: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: HealthCheckService,
          useValue: {
            check: vi.fn().mockReturnValue({ status: 'ok' }),
          },
        },
        {
          provide: HttpHealthIndicator,
          useValue: {
            pingCheck: vi.fn().mockReturnValue({ status: 'ok' }),
          },
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: vi.fn().mockReturnValue({ status: 'ok' }),
            checkRSS: vi.fn().mockReturnValue({ status: 'ok' }),
          },
        },
        {
          provide: DiskHealthIndicator,
          useValue: {
            checkStorage: vi.fn().mockReturnValue({ status: 'ok' }),
          },
        },
        {
          provide: OllamaConfigService,
          useValue: {
            config: {
              host: 'http://localhost:11434',
            },
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            config: {
              health: {
                diskPath: '/',
                diskThresholdPercent: 0.8,
                memoryHeap: 256 * 1024 * 1024,
                memoryRSS: 256 * 1024 * 1024,
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
  });

  describe('checkReady', () => {
    it('calls health check service with correct checks', async () => {
      const result = await service.checkReady();

      expect(healthCheckService.check).toHaveBeenCalled();
      const checkCall = (healthCheckService.check as ReturnType<typeof vi.fn>)
        .mock.calls[0][0];
      expect(checkCall).toHaveLength(5);
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('checkLive', () => {
    it('calls health check service with empty array', async () => {
      const result = await service.checkLive();

      expect(healthCheckService.check).toHaveBeenCalledWith([]);
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('checkReady with undefined health config', () => {
    it('uses default values when health config is undefined', async () => {
      const checkFn = vi.fn().mockReturnValue({ status: 'ok' });
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          HealthService,
          PostgresHealthIndicator,
          {
            provide: PostgresService,
            useValue: {
              ping: vi.fn().mockResolvedValue(undefined),
            },
          },
          {
            provide: HealthCheckService,
            useValue: {
              check: checkFn,
            },
          },
          {
            provide: HttpHealthIndicator,
            useValue: {
              pingCheck: vi.fn().mockReturnValue({ status: 'ok' }),
            },
          },
          {
            provide: MemoryHealthIndicator,
            useValue: {
              checkHeap: vi.fn().mockReturnValue({ status: 'ok' }),
              checkRSS: vi.fn().mockReturnValue({ status: 'ok' }),
            },
          },
          {
            provide: DiskHealthIndicator,
            useValue: {
              checkStorage: vi.fn().mockReturnValue({ status: 'ok' }),
            },
          },
          {
            provide: OllamaConfigService,
            useValue: {
              config: {
                host: 'http://localhost:11434',
              },
            },
          },
          {
            provide: AppConfigService,
            useValue: {
              config: {}, // health is undefined
            },
          },
        ],
      }).compile();

      const svc = module.get<HealthService>(HealthService);
      await svc.checkReady();

      expect(checkFn).toHaveBeenCalled();
      const checkCall = checkFn.mock.calls[0][0];
      expect(checkCall).toHaveLength(5);
    });
  });
});
