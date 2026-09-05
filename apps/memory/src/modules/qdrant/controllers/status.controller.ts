import { Controller, Get } from '@nestjs/common';

import {
  ApeGetMemoryStatus,
  ApeTagsMemory,
} from '../decorators/openapi/swagger.js';
import { MemoryStatusResponseDto } from '../dtos/memory-status.dto.js';
import { QdrantClientService } from '../services/qdrant-client.service.js';

/**
 * Memory storage status probe: whether the feature is enabled, and whether
 * the Qdrant collection for the configured embedding model exists with the
 * expected indexes and vector size.
 */
@ApeTagsMemory()
@Controller('memory')
export class MemoryStatusController {
  constructor(private readonly qdrantClientService: QdrantClientService) {}

  @Get('status')
  @ApeGetMemoryStatus()
  async status(): Promise<MemoryStatusResponseDto> {
    return this.qdrantClientService.getStatus();
  }
}
