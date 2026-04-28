process.env.PORT = '3001';
process.env.ADDRESS = '0.0.0.0';
process.env.NODE_ENV = 'local';
process.env.PRINT_CONFIG = 'true';
process.env.ENABLE_SWAGGER = 'true';
process.env.BODY_LIMIT = '104857600';
process.env.LOG_LEVEL = 'warn';
process.env.CORS_ORIGIN = '*';
process.env.CORS_METHODS = 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE';
process.env.CORS_PREFLIGHT_CONTINUE = 'false';
process.env.CORS_OPTIONS_SUCCESS_STATUS = '204';
process.env.CORS_CREDENTIALS = 'true';
process.env.CORS_ALLOWED_HEADERS =
  'Content-Type,Authorization,Accept,X-Requested-With';

import { Test, TestingModule } from '@nestjs/testing';

import { AppConfigService } from './app-config.service.js';

describe('ConfigFactoryService', () => {
  let service: AppConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppConfigService],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return valid appConfig', () => {
    const appConfig = service.config;
    expect(appConfig).toBeDefined();
    expect(appConfig.port).toBe(3001);
    expect(appConfig.nodeEnv).toBe('local');
    expect(appConfig.printConfig).toBe(true);
    expect(appConfig.cors).toBeDefined();
    expect(appConfig.cors!.origin).toBe('*');
    expect(appConfig.cors!.methods).toBe(
      'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    );
  });
});
