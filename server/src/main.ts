import {
  API_DOCS,
  getBodyLimit,
  getLogLevel,
  logConfigObject,
  logServerPath,
  logSwaggerPath,
  SWAGGER_DOCUMENT,
  VALIDATION_PIPE,
} from '@ehildt/ckir-helpers/bootstrap';
import { SocketIOModule } from '@ehildt/nestjs-socket.io';
import compress from '@fastify/compress';
import fastifyMultipart from '@fastify/multipart';
import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule } from '@nestjs/swagger';

import { AppConfigService } from './configs/app-config.service.js';
import { MainModule } from './main.module.js';

void (async () => {
  const logger = { logger: getLogLevel(process.env.LOG_LEVEL) };
  const adapter = new FastifyAdapter({
    bodyLimit: getBodyLimit(process.env.BODY_LIMIT),
  });

  const APP = await NestFactory.create<NestFastifyApplication>(
    MainModule,
    adapter,
    logger,
  );

  await SocketIOModule.attach(APP);
  const appConfigService = APP.get(AppConfigService);
  await APP.register(fastifyMultipart as any, { attachFieldsToBody: true });
  await APP.register(compress as any, {
    threshold: 1024, // minimum payload size to compress
    encodings: ['br', 'gzip'], // optional: restrict Brotli/gzip
    global: false, // default behavior – compress all
    customTypes: /json/i, // only compress JSON responses (fixes Swagger UI empty page issue)
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
