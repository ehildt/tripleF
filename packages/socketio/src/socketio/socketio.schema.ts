import { z } from 'zod';

export const SocketIOConfigSchema = z.strictObject({
  port: z.number().optional(),
  opts: z
    .strictObject({
      cleanupEmptyChildNamespaces: z.boolean(),
      maxHttpBufferSize: z.number(),
      pingInterval: z.number(),
      pingTimeout: z.number().optional(),
      connectTimeout: z.number(),
      allowEIO3: z.boolean(),
      transports: z.array(z.enum(['websocket', 'polling', 'webtransport'])),
      cors: z.strictObject({
        origin: z.string(),
        credentials: z.boolean(),
        methods: z.array(z.enum(['GET', 'POST'])),
      }),
    })
    .optional(),
});
