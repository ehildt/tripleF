import { buildQueryParams } from '@/utils/build-query-params.helper';

import type { BuildSubmitQueryParamsOptions } from './build-submit-query-params.helper.types';

/**
 * Assemble the harness query string for a submit. Pure: the memory/cognition
 * overrides and the conversation's stream/context/think settings are passed
 * in, and the conversation defaults (stream true, no explicit numCtx,
 * 'medium' think) are applied in one testable place.
 */
export function buildSubmitQueryParams(
  options: BuildSubmitQueryParamsOptions,
): URLSearchParams {
  const {
    requestId,
    sessionId,
    memoryPartition,
    memoryCognition,
    conversationId,
    roomId,
    stream,
    event,
    numCtx,
    think,
    hasNewImages,
    conversationMetadata,
    language,
  } = options;

  return buildQueryParams({
    requestId,
    sessionId,
    memoryPartition,
    memoryCognition,
    conversationId,
    roomId,
    stream: stream ?? true,
    event,
    numCtx: numCtx ?? '',
    think: think ?? 'medium',
    hasNewImages,
    conversationMetadata,
    language,
  });
}
