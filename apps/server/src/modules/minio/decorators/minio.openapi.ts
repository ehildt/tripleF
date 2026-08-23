import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

const ApiParamSessionId = () =>
  ApiParam({
    name: 'sessionId',
    required: true,
    type: String,
    description: 'The sessionId key prefix in the bucket',
  });

const ApiParamConversationId = () =>
  ApiParam({
    name: 'conversationId',
    required: true,
    type: String,
    description: 'The conversationId key prefix within the session',
  });

const ApiParamHash = () =>
  ApiParam({
    name: 'hash',
    required: true,
    type: String,
    description: 'The SHA-256 content hash of the stored object',
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
      summary: 'List stored objects for a sessionId and conversationId',
      description:
        'Returns the list of object keys stored under the images/{sessionId}/{conversationId} prefix.',
    }),
    ApiParamSessionId(),
    ApiParamConversationId(),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'List of object keys',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'No objects found for sessionId/conversationId',
    }),
  );

export const ApiGetObject = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Download a stored object',
      description:
        'Streams the original uploaded buffer for a given sessionId, conversationId and content hash.',
    }),
    ApiParamSessionId(),
    ApiParamConversationId(),
    ApiParamHash(),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Object streamed successfully',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Object not found',
    }),
  );

export const ApiObjectExists = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Check whether a stored object exists',
      description:
        'Returns whether an object exists for the given sessionId, conversationId and content hash.',
    }),
    ApiParamSessionId(),
    ApiParamConversationId(),
    ApiParamHash(),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Object existence status',
    }),
  );

export const ApiDeleteObject = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a stored object',
      description:
        'Removes the object identified by sessionId, conversationId and content hash from MinIO.',
    }),
    ApiParamSessionId(),
    ApiParamConversationId(),
    ApiParamHash(),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Object deleted successfully',
    }),
  );

export const ApiDeleteObjects = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete stored objects for a sessionId and conversationId',
      description:
        'Removes all objects under the images/{sessionId}/{conversationId} prefix from MinIO.',
    }),
    ApiParamSessionId(),
    ApiParamConversationId(),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Objects deleted successfully',
    }),
  );
