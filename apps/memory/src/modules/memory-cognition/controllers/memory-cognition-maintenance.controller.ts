import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';

import { MemoryReflectResponseDto } from '../../memory-partition/dtos/memory-reflect-response.dto.js';
import {
  ApePostCognitionReflect,
  ApeTagsCognitionMaintenance,
} from '../../qdrant/decorators/openapi/swagger.js';
import { MemoryEnqueueService } from '../../qdrant/services/memory-enqueue.service.js';
import { MemoryOverridesService } from '../../qdrant/services/memory-overrides.service.js';
import { MemoryCognitionReflectBodyDto } from '../dtos/memory-cognition-reflect-body.dto.js';

/**
 * The COGNITION maintenance endpoints. The cognition lane is write-driven —
 * the profile recomputes after every answered turn (subconscious formation),
 * so there is no manual profile step. The only manual sweep is:
 *
 * Cognition pipeline (per memoryCognition space):
 *   ① POST /reflect — friction screen over the AI's derived insights; the
 *                      loser's insights are superseded.
 *
 * (Conviction synthesis for the cognition lane is triggered from the
 * partition pipeline's ④ conviction step, which writes both lanes.)
 */
@ApeTagsCognitionMaintenance()
@Controller('memory/cognition')
export class MemoryCognitionMaintenanceController {
  constructor(
    private readonly memoryEnqueue: MemoryEnqueueService,
    private readonly memoryOverrides: MemoryOverridesService,
  ) {}

  @Post('reflect')
  @HttpCode(HttpStatus.OK)
  @ApePostCognitionReflect()
  async reflect(
    @Body() body: MemoryCognitionReflectBodyDto,
  ): Promise<MemoryReflectResponseDto> {
    const memoryCognition = body.memoryCognition.trim();
    if (!memoryCognition) {
      throw new BadRequestException('memoryCognition is required');
    }
    const model = body.model?.trim() || this.memoryOverrides.getReflectModel();
    if (!model) {
      throw new BadRequestException(
        'A reflection model is required — pass "model", set a client override, or set MEMORY_REFLECT_MODEL',
      );
    }
    await this.memoryEnqueue.enqueueReflectJob({
      lane: 'cognition',
      scopeKey: memoryCognition,
      model,
      limit: body.limit,
      dryRun: body.dryRun === true,
    });
    return { accepted: true };
  }
}
