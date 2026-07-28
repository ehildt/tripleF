import {
  DiskHealthIndicator,
  HealthCheckService,
  HealthIndicatorService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';

import { AppConfigService } from '../../../configs/app-config.service.js';
import { OllamaConfigService } from '../../ai-sdk/configs/ollama-config.service.js';
import { DeadLetterRepository } from '../../dead-letter/services/repository.service.js';
import { MinioService } from '../../minio/services/minio.service.js';
import { MinioHealthIndicator } from '../../minio/services/minio-health-indicator.service.js';

import { HealthService } from './health.service.js';
import { PostgresHealthIndicator } from './postgres-health-indicator.service.js';

describe('HealthService', () => {
  let service: HealthService;
  let healthCheckService: HealthCheckService;
  let httpHealthIndicator: HttpHealthIndicator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        PostgresHealthIndicator,
        MinioHealthIndicator,
        {
          provide: DeadLetterRepository,
          useValue: {
            ping: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: MinioService,
          useValue: {
            ping: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: HealthCheckService,
          useValue: {
            check: vi
              .fn()
              .mockImplementation(async (checks: Array<() => unknown>) => {
                await Promise.all(checks.map((check) => check()));
                return { status: 'ok' };
              }),
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
          provide: HealthIndicatorService,
          useValue: {
            check: vi.fn().mockReturnValue({
              up: vi.fn().mockReturnValue({ status: 'up' }),
              down: vi.fn().mockReturnValue({ status: 'down' }),
            }),
          },
        },
        {
          provide: OllamaConfigService,
          useValue: {
            config: {
              host: 'http://localhost:11434/api',
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
    httpHealthIndicator = module.get<HttpHealthIndicator>(HttpHealthIndicator);
  });

  describe('checkReady', () => {
    it('calls health check service with correct checks', async () => {
      const result = await service.checkReady();

      expect(healthCheckService.check).toHaveBeenCalled();
      const checkCall = (healthCheckService.check as ReturnType<typeof vi.fn>)
        .mock.calls[0][0];
      expect(checkCall).toHaveLength(6);
      expect(result).toEqual({ status: 'ok' });
    });

    it('pings the Ollama tags endpoint', async () => {
      await service.checkReady();

      expect(httpHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'ollama',
        'http://localhost:11434/api/tags',
      );
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
          MinioHealthIndicator,
          {
            provide: DeadLetterRepository,
            useValue: {
              ping: vi.fn().mockResolvedValue(undefined),
            },
          },
          {
            provide: MinioService,
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
            provide: HealthIndicatorService,
            useValue: {
              check: vi.fn().mockReturnValue({
                up: vi.fn().mockReturnValue({ status: 'up' }),
                down: vi.fn().mockReturnValue({ status: 'down' }),
              }),
            },
          },
          {
            provide: OllamaConfigService,
            useValue: {
              config: {
                host: 'http://localhost:11434/api',
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
      expect(checkCall).toHaveLength(6);
    });
  });
});
