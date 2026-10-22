import { Injectable, Logger } from '@nestjs/common';
import type {
  EncyclopediaDocumentInput,
  EncyclopediaDocumentResult,
  EncyclopediaSearchHit,
  EncyclopediaSearchInput,
  EncyclopediaSelectInput,
  EncyclopediaSelectResult,
} from '@triplef/agent/schemas';

import type {
  IndexEncyclopediaDocumentsInput,
  IndexEncyclopediaDocumentsOutcome,
} from './memory-encyclopedia.service.types.js';
import { MemoryHttpTransportService } from './memory-http-transport.service.js';

/**
 * Encyclopedia lane (`/encyclopedia/*`) — the memory app's shared,
 * not-partition-scoped knowledge base: the search/read/select probe paths
 * and the persist-only document index. Reads degrade to empty/null so an
 * encyclopedia outage never breaks a turn; the two budget-relevant reads
 * warn before degrading so context-loss is visible in the logs.
 */
@Injectable()
export class MemoryEncyclopediaService {
  private readonly logger = new Logger(MemoryEncyclopediaService.name);

  constructor(private readonly transport: MemoryHttpTransportService) {}

  /**
   * Agentic knowledge-base search (the encyclopedia-search tool's read path)
   * — semantic search over every persisted source, optionally scoped to one
   * document url or domain. Degrades to an empty result on any failure.
   */
  async searchEncyclopedia(
    input: EncyclopediaSearchInput,
  ): Promise<EncyclopediaSearchHit[]> {
    if (!this.transport.enabled) return [];
    try {
      return await this.transport.request<EncyclopediaSearchHit[]>(
        `${this.transport.baseUrl}/encyclopedia/search`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
    } catch {
      return [];
    }
  }

  /**
   * Agentic document deep-dive (the encyclopedia-read tool's read path) — a
   * windowed verbatim read of one stored document, continuation via offset.
   * Degrades to null on any failure.
   */
  async readEncyclopediaDocument(
    input: EncyclopediaDocumentInput,
  ): Promise<EncyclopediaDocumentResult | null> {
    if (!this.transport.enabled) return null;
    try {
      return await this.transport.request<EncyclopediaDocumentResult | null>(
        `${this.transport.baseUrl}/encyclopedia/document`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
    } catch {
      return null;
    }
  }

  /**
   * Ephemeral retrieval selection: rank fetched source passages against the
   * query and return the budget-filled verbatim chunks. Null on any failure
   * (disabled, outage, 503) — the harness falls back to full references.
   */
  async selectContext(
    input: EncyclopediaSelectInput,
  ): Promise<EncyclopediaSelectResult | null> {
    if (!this.transport.enabled) return null;
    try {
      return await this.transport.request<EncyclopediaSelectResult>(
        `${this.transport.baseUrl}/encyclopedia/select`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
    } catch (error) {
      this.logger.warn(
        `encyclopedia select failed — falling back to full references: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /**
   * Index uploaded documents into the shared encyclopedia (persist-only, no
   * selection). Fire-and-forget: a encyclopedia outage must never break the turn.
   */
  async indexEncyclopediaDocuments(
    input: IndexEncyclopediaDocumentsInput,
  ): Promise<IndexEncyclopediaDocumentsOutcome | null> {
    if (!this.transport.enabled) return null;
    try {
      return await this.transport.request<IndexEncyclopediaDocumentsOutcome>(
        `${this.transport.baseUrl}/encyclopedia/index`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
    } catch (error) {
      this.logger.warn(
        `encyclopedia index failed — uploads not persisted: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }
}
