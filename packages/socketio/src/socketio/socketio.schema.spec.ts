import { SocketIOConfigSchema } from './socketio.schema.ts';

describe('SocketIOConfigSchema', () => {
  it('should validate a valid full config', () => {
    const config = {
      port: 3000,
      opts: {
        cleanupEmptyChildNamespaces: false,
        maxHttpBufferSize: 1e6,
        pingInterval: 25000,
        pingTimeout: 20000,
        connectTimeout: 45000,
        allowEIO3: false,
        transports: ['websocket', 'polling'],
        cors: {
          origin: '*',
          credentials: true,
          methods: ['GET', 'POST'],
        },
      },
    };

    expect(SocketIOConfigSchema.safeParse(config).success).toBe(true);
  });

  it('should validate a port-only config', () => {
    const config = { port: 3000 };

    expect(SocketIOConfigSchema.safeParse(config).success).toBe(true);
  });

  it('should validate an empty config', () => {
    expect(SocketIOConfigSchema.safeParse({}).success).toBe(true);
  });

  it('should reject an invalid transport', () => {
    const config = {
      opts: {
        cleanupEmptyChildNamespaces: false,
        maxHttpBufferSize: 1e6,
        pingInterval: 25000,
        connectTimeout: 45000,
        allowEIO3: false,
        transports: ['invalid'],
        cors: {
          origin: '*',
          credentials: true,
          methods: ['GET', 'POST'],
        },
      },
    };

    const result = SocketIOConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('transports'))).toBe(true);
  });

  it('should reject an invalid cors method', () => {
    const config = {
      opts: {
        cleanupEmptyChildNamespaces: false,
        maxHttpBufferSize: 1e6,
        pingInterval: 25000,
        connectTimeout: 45000,
        allowEIO3: false,
        transports: ['websocket'],
        cors: {
          origin: '*',
          credentials: true,
          methods: ['PUT'],
        },
      },
    };

    const result = SocketIOConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('methods'))).toBe(true);
  });

  it('should reject a non-numeric port', () => {
    const config = { port: 'not-a-number' };

    const result = SocketIOConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('port'))).toBe(true);
  });
});
