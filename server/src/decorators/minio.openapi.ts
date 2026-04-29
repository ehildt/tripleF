import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

const ApiParamRequestId = () =>
  ApiParam({
    name: 'requestId',
    required: true,
    type: String,
    description: 'The requestId key prefix in the bucket',
  });

export const ApiGetBucketInfo = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get MinIO bucket info',
      description:
        'Returns the configured bucket name and endpoint for the MinIO connection.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Bucket information',
    }),
  );

export const ApiListObjects = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List stored objects for a requestId',
      description:
        'Returns the list of object keys stored under the jobs/{requestId} prefix.',
    }),
    ApiParamRequestId(),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'List of object keys',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'No objects found for requestId',
    }),
  );

export const ApiDeleteObjects = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete stored objects for a requestId',
      description:
        'Removes all objects under the jobs/{requestId} prefix from MinIO.',
    }),
    ApiParamRequestId(),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Objects deleted successfully',
    }),
  );
