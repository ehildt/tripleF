import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  ApeGetTaxonomyTree,
  ApePatchTaxonomyNode,
  ApePostTaxonomyMerge,
  ApeTagsTaxonomy,
} from '../../qdrant/decorators/openapi/swagger.js';
import { MemoryTaxonomyMergeBodyDto } from '../dtos/memory-taxonomy-merge-body.dto.js';
import { MemoryTaxonomyQueryDto } from '../dtos/memory-taxonomy-query.dto.js';
import { MemoryTaxonomyUpdateBodyDto } from '../dtos/memory-taxonomy-update-body.dto.js';
import type { TaxonomyNodeView } from '../services/taxonomy.service.js';
import { TaxonomyService } from '../services/taxonomy.service.js';

/**
 * The taxonomy management endpoints — the macro-taxonomy's user surface.
 * The registry is the AI's read-only pick-list: the model adopts or mints
 * labels via the probe contract; only these endpoints rename, merge, or
 * re-icon persisted labels. Every mutation propagates to the leaf payloads
 * immediately, so the next probe/classify pass sees the updated taxonomy.
 */
@ApeTagsTaxonomy()
@Controller('memory/taxonomy')
export class MemoryTaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  /**
   * The scope's full taxonomy tree with per-node metadata: leaf/linked
   * counts, child counts, maintenance stamps, aliases, icons.
   */
  @Get()
  @ApeGetTaxonomyTree()
  async listTaxonomy(
    @Query() query: MemoryTaxonomyQueryDto,
  ): Promise<{ nodes: TaxonomyNodeView[] }> {
    const scopeKey = query.scopeKey.trim();
    if (!scopeKey) throw new BadRequestException('scopeKey is required');
    return {
      nodes: await this.taxonomyService.listTree(query.lane, scopeKey),
    };
  }

  /** Rename a node and/or set/clear its icon. */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApePatchTaxonomyNode()
  async updateTaxonomyNode(
    @Param('id') id: string,
    @Body() body: MemoryTaxonomyUpdateBodyDto,
  ): Promise<{ updated: true }> {
    if (body.name === undefined && body.icon === undefined) {
      throw new BadRequestException('Nothing to update — pass name or icon');
    }
    if (body.name !== undefined) {
      await this.taxonomyService.renameNode(id, body.name);
    }
    if (body.icon !== undefined) {
      await this.taxonomyService.setIcon(id, body.icon ?? null);
    }
    return { updated: true };
  }

  /** Merge the node into another (same scope + tier). */
  @Post(':id/merge')
  @HttpCode(HttpStatus.OK)
  @ApePostTaxonomyMerge()
  async mergeTaxonomyNode(
    @Param('id') id: string,
    @Body() body: MemoryTaxonomyMergeBodyDto,
  ): Promise<{ merged: true }> {
    await this.taxonomyService.mergeNode(id, body.into);
    return { merged: true };
  }
}
