import compress from '@fastify/compress';
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
import { createCoreLoggerOptions } from '@triplef/helpers/logger-options';

import { AppConfigService } from './configs/app-config.service.js';
import { MemoryModule } from './main.module.js';

process.on('unhandledRejection', (reason) => {
  const log = new Logger('UnhandledRejection');
  log.error(reason instanceof Error ? reason : new Error(String(reason)));
});
process.on('uncaughtException', (error) => {
  const log = new Logger('UncaughtException');
  log.error(error);
  process.exit(1);
});

void (async () => {
  const adapter = new FastifyAdapter({
    bodyLimit: getBodyLimit(process.env.BODY_LIMIT),
    // Fastify's built-in pino request logger — same options (level, redact,
    // pretty/JSON) as the app-wide core logger, so every request emits a
    // structured completion line (method, url, statusCode, responseTime).
    logger: createCoreLoggerOptions(process.env),
  });

  const APP = await NestFactory.create<NestFastifyApplication>(
    MemoryModule,
    adapter,
    { bufferLogs: true },
  );

  APP.useLogger(APP.get(CoreLoggerService));

  // Health probes poll constantly — silence their request logs.
  APP.getHttpAdapter()
    .getInstance()
    .addHook('onRequest', (request, _reply, done) => {
      if (request.url.includes('/health')) request.log.level = 'silent';
      done();
    });

  const appConfigService = APP.get(AppConfigService);
  await APP.register(compress as any, {
    threshold: 1024, // minimum payload size to compress
    encodings: ['br', 'gzip'], // optional: restrict Brotli/gzip
    // Compress every response matching the custom types below. `global: false`
    // would require a per-route opt-in, leaving API payloads (memory JSON)
    // uncompressed — the browser connection budget on HTTP/1.1 makes that a
    // first-paint tax. Non-JSON responses are excluded by customTypes.
    global: true,
    customTypes: /json/i, // only compress JSON responses
  });

  APP.enableCors(appConfigService.config.cors);
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
