import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';

import { MemorySearchService } from '../../memory-partition/services/memory-search.service.js';
import {
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
  ) {}

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
