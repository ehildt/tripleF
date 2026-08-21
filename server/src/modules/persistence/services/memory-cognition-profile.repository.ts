import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { Prisma, PrismaClient } from '../../../generated/prisma/client.js';
import type { PostgresConfig } from '../../dead-letter/configs/postgres-config.adapter.js';
import { POSTGRES_CONFIG } from '../../dead-letter/constants/postgres.constants.js';

/** Provenance of the last harness turn that updated the cognition document. */
interface CognitionProfileProvenance {
  sessionId?: string;
  conversationId?: string;
  requestId?: string;
}

/** The stored cognition profile row (profile is the parsed JSON document). */
interface MemoryCognitionProfileRow {
  profile: Record<string, unknown>;
  lastSessionId?: string | null;
  lastConversationId?: string | null;
  lastRequestId?: string | null;
  updatedAt: Date;
}

/**
 * Postgres storage for the AI's structured cognition profile — the single
 * living JSON document per cognition space (the memory_cognition lane).
 * One row per space key; the document is merged in code
 * (mergeCognitionProfiles) and atomically upserted here. Insight vectors
 * (the depth under profile paths) stay in Qdrant; only the routing-map
 * document lives in this table.
 */
@Injectable()
export class MemoryCognitionProfileRepository
  implements OnModuleInit, OnModuleDestroy
{
  private _prisma: PrismaClient | null = null;

  constructor(
    @Inject(POSTGRES_CONFIG)
    private readonly _config: PostgresConfig,
  ) {}

  get prisma() {
    return this._prisma as PrismaClient;
  }

  async onModuleInit() {
    const adapter = new PrismaPg({
      connectionString: this._config.url,
    });
    this._prisma = new PrismaClient({ adapter });
  }

  async onModuleDestroy() {
    await this._prisma?.$disconnect();
    this._prisma = null;
  }

  /** The stored document for a cognition space, when one exists. */
  async findBySpace(
    space: string,
  ): Promise<MemoryCognitionProfileRow | undefined> {
    const row = await this.prisma.memoryCognitionProfile.findUnique({
      where: { space },
    });
    if (!row) return undefined;
    return {
      profile: row.profile as Record<string, unknown>,
      lastSessionId: row.lastSessionId,
      lastConversationId: row.lastConversationId,
      lastRequestId: row.lastRequestId,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Atomically replace the document of a space (create or update in one
   * row). The caller hands the MERGED document — merges are resolved in
   * code, never at the storage layer.
   */
  async upsert(
    space: string,
    profile: Record<string, unknown>,
    provenance: CognitionProfileProvenance,
  ): Promise<void> {
    const data: Prisma.MemoryCognitionProfileUpdateInput = {
      profile: profile as Prisma.InputJsonValue,
      lastSessionId: provenance.sessionId ?? null,
      lastConversationId: provenance.conversationId ?? null,
      lastRequestId: provenance.requestId ?? null,
    };
    await this.prisma.memoryCognitionProfile.upsert({
      where: { space },
      create: { space, ...data } as Prisma.MemoryCognitionProfileCreateInput,
      update: data,
    });
  }

  /** Drop the document of a space (cognition wipe — the Qdrant purge is the caller's job). */
  async deleteBySpace(space: string): Promise<void> {
    await this.prisma.memoryCognitionProfile
      .delete({ where: { space } })
      // A wipe also fires when nothing was persisted yet — that is fine.
      .catch(() => null);
  }
}
