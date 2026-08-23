import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export const ApeTagsHealth = () => ApiTags('Health');

export const ApeGetHealthReady = () =>
  applyDecorators(
    ApiResponse({ status: 200, description: 'Service is ready' }),
    ApiOperation({ summary: 'Readiness probe' }),
  );

export const ApeGetHealthLive = () =>
  applyDecorators(
    ApiResponse({ status: 200, description: 'Service is alive' }),
    ApiOperation({ summary: 'Liveness probe' }),
  );
