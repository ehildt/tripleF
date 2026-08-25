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

    const { error } = SocketIOConfigSchema.validate(config);
    expect(error).toBeUndefined();
  });

  it('should validate a port-only config', () => {
    const config = { port: 3000 };

    const { error } = SocketIOConfigSchema.validate(config);
    expect(error).toBeUndefined();
  });

  it('should validate an empty config', () => {
    const { error } = SocketIOConfigSchema.validate({});
    expect(error).toBeUndefined();
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

    const { error } = SocketIOConfigSchema.validate(config);
    expect(error).toBeDefined();
    expect(error!.message).toContain('transports');
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

    const { error } = SocketIOConfigSchema.validate(config);
    expect(error).toBeDefined();
    expect(error!.message).toContain('methods');
  });

  it('should reject a non-numeric port', () => {
    const config = { port: 'not-a-number' };

    const { error } = SocketIOConfigSchema.validate(config);
    expect(error).toBeDefined();
    expect(error!.message).toContain('port');
  });
});
