import compress from '@fastify/compress';
import fastifyMultipart from '@fastify/multipart';
import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule } from '@nestjs/swagger';
import { CoreLoggerService } from '@triplef/core-logger';
import {
  API_DOCS,
  getBodyLimit,
  logConfigObject,
  logServerPath,
  logSwaggerPath,
  SWAGGER_DOCUMENT,
  VALIDATION_PIPE,
} from '@triplef/helpers/bootstrap';
import { SocketIOModule } from '@triplef/socketio';

import { AppConfigService } from './configs/app-config.service.js';
import { MainModule } from './main.module.js';

void (async () => {
  // Fastify's own request logger stays off (adapter default): the one
  // request worth logging — the harness — logs itself with full domain
  // context (requestId, session, conversation) in the controller.
  const adapter = new FastifyAdapter({
    bodyLimit: getBodyLimit(process.env.BODY_LIMIT),
  });

  const APP = await NestFactory.create<NestFastifyApplication>(
    MainModule,
    adapter,
    { bufferLogs: true },
  );

  APP.useLogger(APP.get(CoreLoggerService));

  await SocketIOModule.attach(APP);
  const appConfigService = APP.get(AppConfigService);
  await APP.register(fastifyMultipart as any, { attachFieldsToBody: true });
  await APP.register(compress as any, {
    threshold: 1024, // minimum payload size to compress
    encodings: ['br', 'gzip'], // optional: restrict Brotli/gzip
    // Compress every response matching the custom types below. `global: false`
    // would require a per-route opt-in, leaving API payloads (conversation
    // JSON, models, DLQ) uncompressed — the browser connection budget on
    // HTTP/1.1 makes that a first-paint tax. Non-JSON responses (storage
    // image proxying) are excluded by customTypes.
    global: true,
    customTypes: /json/i, // only compress JSON responses (fixes Swagger UI empty page issue)
  });

  // The adapter yields `undefined` when CORS_ORIGIN is unset (CORS off);
  // enableCors(undefined) would register @fastify/cors with its wildcard
  // defaults (origin: '*'), so only register when a config exists.
  const cors = appConfigService.config.cors;
  if (cors) APP.enableCors(cors);
  APP.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  const swaggerDocument = SwaggerModule.createDocument(APP, SWAGGER_DOCUMENT);
  SwaggerModule.setup(API_DOCS, APP, swaggerDocument);

  APP.useGlobalPipes(VALIDATION_PIPE);
  APP.enableShutdownHooks(['SIGINT', 'SIGTERM', 'SIGQUIT']);

  await APP.listen(
    {
      port: appConfigService.config.port,
      host: appConfigService.config.address,
    },
    () => {
      const nestLogger = APP.get(Logger);
      logConfigObject(nestLogger, appConfigService.config);
      logServerPath(nestLogger, appConfigService.config);
      logSwaggerPath(nestLogger, appConfigService.config);
    },
  );
})();
