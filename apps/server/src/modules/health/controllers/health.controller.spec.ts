import { Test, TestingModule } from '@nestjs/testing';

import { HealthService } from '../services/health.service.js';

import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            checkReady: vi.fn().mockReturnValue({ status: 'ok' }),
            checkLive: vi.fn().mockReturnValue({ status: 'ok' }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  describe('ready', () => {
    it('calls healthService.checkReady', async () => {
      const result = await controller.ready();

      expect(healthService.checkReady).toHaveBeenCalled();
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('live', () => {
    it('calls healthService.checkLive', async () => {
      const result = await controller.live();

      expect(healthService.checkLive).toHaveBeenCalled();
      expect(result).toEqual({ status: 'ok' });
    });
  });
});
