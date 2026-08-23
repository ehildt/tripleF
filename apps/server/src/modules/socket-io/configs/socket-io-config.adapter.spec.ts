import { SocketIOConfigAdapter } from './socket-io-config.adapter.js';

describe('SocketIOConfigAdapter', () => {
  it('returns expected config from env object', () => {
    const config = SocketIOConfigAdapter({
      SOCKET_IO_EVENT: 'harness',
      SOCKET_IO_PORT: '3000',
      SOCKET_IO_MAX_HTTP_BUFFER_SIZE: '262144',
      SOCKET_IO_CLEANUP_EMPTY_CHILD_NAMESPACES: 'false',
      SOCKET_IO_TRANSPORTS: 'websocket,polling,webtransport',
      SOCKET_IO_CORS_ORIGIN: '*',
      SOCKET_IO_CORS_CREDENTIALS: 'true',
      SOCKET_IO_CORS_METHODS: 'GET,POST',
      SOCKET_IO_PING_INTERVAL: '25000',
      SOCKET_IO_PING_TIMEOUT: '5000',
      SOCKET_IO_ALLOW_EIO3: 'false',
    });

    expect(config).toEqual({
      opts: {
        maxHttpBufferSize: 262144,
        cleanupEmptyChildNamespaces: false,
        transports: ['websocket', 'polling', 'webtransport'],
        cors: {
          origin: '*',
          credentials: true,
          methods: ['GET', 'POST'],
        },
        pingInterval: 25000,
        pingTimeout: 5000,
        connectTimeout: 45000,
        allowEIO3: false,
      },
    });
  });

  it('uses default values when env vars are not provided', () => {
    const config = SocketIOConfigAdapter({
      SOCKET_IO_EVENT: 'harness',
      SOCKET_IO_PORT: '3000',
    });

    expect(config.opts!.maxHttpBufferSize).toBe(262144);
    expect(config.opts!.pingInterval).toBe(25000);
    expect(config.opts!.pingTimeout).toBe(5000);
  });

  it('handles missing optional env vars', () => {
    const config = SocketIOConfigAdapter({
      SOCKET_IO_EVENT: 'harness',
      SOCKET_IO_PORT: '3000',
    });

    expect(config.opts!.transports).toEqual(['websocket', 'polling']);
  });

  it('uses default values for all optional settings', () => {
    const config = SocketIOConfigAdapter({
      SOCKET_IO_EVENT: 'harness',
      SOCKET_IO_PORT: '3000',
    });

    expect(config.opts!.connectTimeout).toBe(45000);
    expect(config.opts!.allowEIO3).toBe(true);
    const cors = config.opts!.cors as {
      origin: string;
      credentials: boolean;
      methods: string[];
    };
    expect(cors.origin).toBe('*');
    expect(cors.credentials).toBe(false);
    expect(cors.methods).toEqual(['GET', 'POST']);
  });

  it('handles empty env returns valid config with defaults', () => {
    const config = SocketIOConfigAdapter({});
    expect(config.opts).toBeDefined();
    expect(config.opts!.maxHttpBufferSize).toBe(262144);
  });
});
