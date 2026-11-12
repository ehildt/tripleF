import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';

import { MemoryDeleteQueryDto } from '../../memory-partition/dtos/memory-delete-query.dto.js';
import { MemoryDeleteResponseDto } from '../../memory-partition/dtos/memory-delete-response.dto.js';
import { MemorySearchService } from '../../memory-partition/services/memory-search.service.js';
import { VectorizeService } from '../../memory-partition/services/vectorize.service.js';
import {
  ApeDeleteMemoryText,
  ApeGetMemoryCognition,
  ApePostCognitionInsight,
  ApePostMemorySearchConvictions,
  ApeTagsMemoryCognition,
} from '../../qdrant/decorators/openapi/swagger.js';
import type { MemoryPoint } from '../../qdrant/models/memory.model.js';
import { MemoryOverridesService } from '../../qdrant/services/memory-overrides.service.js';
import { MemoryCognitionQueryDto } from '../dtos/memory-cognition-query.dto.js';
import { MemoryCognitionSnapshotDto } from '../dtos/memory-cognition-snapshot.dto.js';
import { MemorySearchConvictionsDto } from '../dtos/memory-search-convictions.dto.js';
import { MemoryStoreInsightDto } from '../dtos/memory-store-insight.dto.js';
import { MemoryCognitionService } from '../services/memory-cognition.service.js';

/**
 * The cognition lane's read/write REST surface: the profile snapshot, insight
 * store, and conviction search.
 */
@ApeTagsMemoryCognition()
@Controller('memory')
export class MemoryCognitionController {
  constructor(
    private readonly memoryCognitionService: MemoryCognitionService,
    private readonly memoryOverrides: MemoryOverridesService,
    private readonly memorySearchService: MemorySearchService,
    private readonly vectorizeService: VectorizeService,
  ) {}

  /**
   * The shared text-delete route (both lanes converge here wire-wise): the
   * cognition branch (`cognition=true`) deletes AI-side understanding, the
   * partition branch deletes facts — always matcher-scoped, never anonymous.
   * Lives on the cognition controller so the lane module graph stays layered
   * (cognition imports partition, never the reverse).
   */
  @Delete('text')
  @ApeDeleteMemoryText()
  async deleteText(
    @Query() query: MemoryDeleteQueryDto,
  ): Promise<MemoryDeleteResponseDto> {
    const partition = query.memoryPartition ?? query.sessionId;
    if (!partition) {
      throw new BadRequestException(
        'Deletes are never anonymous: pass memoryPartition or sessionId',
      );
    }

    // Cognition mode: WITH a matcher (verbatim insight text and/or a profile
    // path) this is the targeted per-item delete (memory-cognition-delete
    // tool); WITHOUT one it wipes the AI's whole understanding of the user.
    if (query.cognition === true) {
      if (query.text || query.path) {
        return await this.memoryCognitionService.deleteCognitionRecords({
          memoryCognition: partition,
          text: query.text,
          path: query.path,
        });
      }
      const texts =
        await this.memoryCognitionService.deleteCognition(partition);
      return { deleted: texts.length, texts };
    }

    const hasMatcher =
      query.text ||
      query.contains ||
      query.tags?.length ||
      query.conversationId ||
      query.requestId;
    if (!hasMatcher) {
      // The mem0 rule: never execute an unscoped delete. Whole-partition
      // wipes have their own endpoint (DELETE /memory).
      throw new BadRequestException(
        'Pass at least one matcher (text, contains, tags, conversationId, requestId)',
      );
    }

    try {
      return await this.vectorizeService.deleteRecords({
        memoryPartition: partition,
        sessionId: query.sessionId,
        conversationId: query.conversationId,
        requestId: query.requestId,
        text: query.text,
        contains: query.contains,
        tags: query.tags,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'memory delete failed',
      );
    }
  }

  @Get('cognition')
  @ApeGetMemoryCognition()
  async getCognition(
    @Query() query: MemoryCognitionQueryDto,
  ): Promise<MemoryCognitionSnapshotDto> {
    const profile = await this.memoryCognitionService.getProfile(
      query.memoryCognition,
    );
    const insights = await this.memoryCognitionService.listInsights(
      query.memoryCognition,
      100,
    );
    const convictions = await this.memoryCognitionService.listConvictions(
      query.memoryCognition,
      100,
    );
    return {
      profile: profile ? JSON.stringify(profile) : null,
      insights,
      convictions,
      profileHeat: this.memoryCognitionService.calcProfileHeat(insights),
      episodeProbeLimit: this.memoryOverrides.getEpisodeProbeLimit(),
    };
  }

  @Post('cognition/insights')
  @HttpCode(HttpStatus.OK)
  @ApePostCognitionInsight()
  async storeInsight(@Body() body: MemoryStoreInsightDto) {
    try {
      const id = await this.memoryCognitionService.storeInsight(
        {
          memoryCognition: body.memoryCognition,
          sessionId: body.sessionId,
          conversationId: body.conversationId,
          requestId: body.requestId,
        },
        { text: body.text, path: body.path },
      );
      return { accepted: true, id };
    } catch {
      // Feature off or embed/store outage — memory is a background concern.
      return { accepted: false };
    }
  }

  @Post('search/convictions')
  @HttpCode(HttpStatus.OK)
  @ApePostMemorySearchConvictions()
  async searchConvictions(
    @Body() body: MemorySearchConvictionsDto,
  ): Promise<MemoryPoint[]> {
    return this.memorySearchService.searchConvictions({
      memoryCognition: body.memoryCognition,
      text: body.text,
      limit: body.limit,
    });
  }
}
