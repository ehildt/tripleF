import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';

import { SocketIOConfig } from './socket-io-config.service.js';

export function SocketIOConfigAdapter(env = process.env): SocketIOConfig {
  return {
    event: env.SOCKET_IO_EVENT!,
    opts: {
      maxHttpBufferSize: Number(
        getNumberEnv(env.SOCKET_IO_MAX_HTTP_BUFFER_SIZE, 262144),
      ),
      cleanupEmptyChildNamespaces:
        getBooleanEnv(env.SOCKET_IO_CLEANUP_EMPTY_CHILD_NAMESPACES) ?? false,
      transports: (env.SOCKET_IO_TRANSPORTS?.split(',') ?? [
        'websocket',
        'polling',
      ]) as Array<'websocket' | 'polling' | 'webtransport'>,
      cors: {
        origin: env.SOCKET_IO_CORS_ORIGIN ?? '*',
        credentials: getBooleanEnv(env.SOCKET_IO_CORS_CREDENTIALS) ?? false,
        methods: (env.SOCKET_IO_CORS_METHODS?.split(',') ?? [
          'GET',
          'POST',
        ]) as Array<'GET' | 'POST'>,
      },
      pingInterval: Number(getNumberEnv(env.SOCKET_IO_PING_INTERVAL, 25000)),
      pingTimeout: Number(getNumberEnv(env.SOCKET_IO_PING_TIMEOUT, 5000)),
      connectTimeout: Number(
        getNumberEnv(env.SOCKET_IO_CONNECT_TIMEOUT, 45000),
      ),
      allowEIO3: getBooleanEnv(env.SOCKET_IO_ALLOW_EIO3) ?? true,
    },
  };
}
