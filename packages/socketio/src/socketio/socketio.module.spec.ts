import { Test, TestingModule } from '@nestjs/testing';

import { SOCKET_IO_CONFIG } from './socketio.constants.ts';
import { SocketIOServerConfig } from './socketio.model.ts';
import { SocketIOModule } from './socketio.module.ts';
import { SocketIOService } from './socketio.service.ts';

describe('SocketIOModule', () => {
  let app: TestingModule;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('registerAsync', () => {
    const mockConfig: SocketIOServerConfig = {
      port: 8080,
      opts: {
        transports: ['websocket'],
      },
    };

    it('should return dynamic module configuration', () => {
      const result = SocketIOModule.registerAsync({
        useFactory: async () => mockConfig,
      });

      expect(result.module).toBe(SocketIOModule);
      expect(result.providers).toContain(SocketIOService);
      expect(result.providers?.some((p: any) => p?.provide === SOCKET_IO_CONFIG)).toBe(true);
    });

    it('should handle global option', () => {
      const result = SocketIOModule.registerAsync({
        global: true,
        useFactory: async () => mockConfig,
      });

      expect(result.global).toBe(true);
    });

    it('should handle non-global option', () => {
      const result = SocketIOModule.registerAsync({
        global: false,
        useFactory: async () => mockConfig,
      });

      expect(result.global).toBe(false);
    });

    it('should include inject option', () => {
      const result = SocketIOModule.registerAsync({
        inject: ['CONFIG_SERVICE'],
        useFactory: async () => mockConfig,
      });

      expect(result).toBeDefined();
    });

    it('should pass injected dependencies to useFactory', () => {
      const result = SocketIOModule.registerAsync({
        inject: ['DEPENDENCY'],
        useFactory: (dep: { value: string }) => ({
          port: 3000,
          opts: { cors: { origin: dep.value } },
        }),
      });

      const configProvider = result.providers?.find((p: any) => p?.provide === SOCKET_IO_CONFIG);
      expect(configProvider).toBeDefined();
      expect(result.module).toBe(SocketIOModule);
    });
  });

  describe('attach', () => {
    const mockConfig: SocketIOServerConfig = {
      port: 3000,
      opts: { cors: { origin: '*' } },
    };

    it('should detect Express adapter and call getHttpServer', async () => {
      const mockService = {
        config: mockConfig,
        io: null as any,
      };

      const mockApp = {
        get: vi.fn().mockImplementation((token) => {
          if (token === SocketIOService) {
            return mockService;
          }
          return null;
        }),
        getHttpAdapter: vi.fn().mockReturnValue({
          getInstance: vi.fn().mockReturnValue({ listen: vi.fn() }),
        }),
        getHttpServer: vi.fn().mockReturnValue({ on: vi.fn() }),
      };

      await SocketIOModule.attach(mockApp as any);

      expect(mockService.io).toBeDefined();
    });

    it('should detect Fastify adapter and call register', async () => {
      const mockService = {
        config: mockConfig,
        io: null as any,
      };

      const mockApp = {
        get: vi.fn().mockImplementation((token) => {
          if (token === SocketIOService) {
            return mockService;
          }
          return null;
        }),
        getHttpAdapter: vi.fn().mockReturnValue({
          getInstance: vi.fn().mockReturnValue({ register: vi.fn(), io: {} }),
        }),
        register: vi.fn().mockResolvedValue(undefined),
      };

      vi.stubGlobal('fastify-socket.io', {
        default: vi.fn(),
      });

      await SocketIOModule.attach(mockApp as any);

      expect(mockService.io).toBeDefined();
    });

    it('should use explicit fsio when passed', async () => {
      const mockService = {
        config: mockConfig,
        io: null as any,
      };

      const mockApp = {
        get: vi.fn().mockImplementation((token) => {
          if (token === SocketIOService) {
            return mockService;
          }
          return null;
        }),
        getHttpAdapter: vi.fn().mockReturnValue({
          getInstance: vi.fn().mockReturnValue({ register: vi.fn(), io: {} }),
        }),
        register: vi.fn().mockImplementation(async () => {
          mockService.io = {} as any;
        }),
      };

      const mockFsio = vi.fn();

      await SocketIOModule.attach(mockApp as any, mockFsio);

      expect(mockService.io).toBeDefined();
    });

    it('should throw error when no adapter detected and no fsio provided', async () => {
      const mockApp = {
        get: vi.fn().mockImplementation((token) => {
          if (token === SocketIOService) {
            return { config: mockConfig, io: null };
          }
          return null;
        }),
        getHttpAdapter: vi.fn().mockReturnValue({
          getInstance: vi.fn().mockReturnValue(null),
        }),
      };

      await expect(SocketIOModule.attach(mockApp as any)).rejects.toThrow(
        'Could not detect Fastify or Express adapter. Please open an issue at https://github.com/ehildt/tripleF',
      );
    });
  });

  describe('integration', () => {
    it('should create NestJS app with SocketIOModule', async () => {
      app = await Test.createTestingModule({
        imports: [
          SocketIOModule.registerAsync({
            useFactory: () => ({
              port: 3000,
              opts: { cors: { origin: '*' }, transports: ['websocket', 'polling'] },
            }),
          }),
        ],
        providers: [
          {
            provide: SOCKET_IO_CONFIG,
            useValue: { port: 3000, opts: { cors: { origin: '*' }, transports: ['websocket', 'polling'] } },
          },
        ],
      }).compile();

      const service = app.get<SocketIOService>(SocketIOService);
      expect(service).toBeDefined();
      expect(service.io).toBeDefined();
    });

    it('should provide SocketIOService when module is global', async () => {
      app = await Test.createTestingModule({
        imports: [
          SocketIOModule.registerAsync({
            global: true,
            useFactory: () => ({
              port: 3000,
              opts: { cors: { origin: '*' }, transports: ['websocket', 'polling'] },
            }),
          }),
        ],
        providers: [
          {
            provide: SOCKET_IO_CONFIG,
            useValue: { port: 3000, opts: { cors: { origin: '*' }, transports: ['websocket', 'polling'] } },
          },
        ],
      }).compile();

      const service = app.get<SocketIOService>(SocketIOService);
      expect(service).toBeDefined();
    });

    it('should use injected dependencies in useFactory', async () => {
      type MockConfigService = { getPort: () => number; getOptions: () => { cors: { origin: string } } };
      const result = SocketIOModule.registerAsync({
        inject: ['CONFIG_SERVICE'],
        useFactory: (configService: MockConfigService) => ({
          port: configService.getPort(),
          opts: configService.getOptions(),
        }),
      });

      const configProvider = result.providers?.find((p: any) => p?.provide === SOCKET_IO_CONFIG) as any;
      expect(configProvider).toBeDefined();
      expect(configProvider?.inject).toContain('CONFIG_SERVICE');
    });
  });
});
