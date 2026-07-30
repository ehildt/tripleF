import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import {
  PrismaClient,
  type ShownMediaKind,
} from '../../../generated/prisma/client.js';
import type { PostgresConfig } from '../../dead-letter/configs/postgres-config.adapter.js';
import { POSTGRES_CONFIG } from '../../dead-letter/constants/postgres.constants.js';

interface ShownMediaEntry {
  kind: ShownMediaKind;
  mediaKey: string;
}

/**
 * Registry of media the user has already been shown, scoped to a
 * conversation. Keyed by (sessionId, conversationId, kind, mediaKey) so
 * repeated inserts are idempotent upserts.
 */
@Injectable()
export class ShownMediaRepository implements OnModuleInit, OnModuleDestroy {
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

  /** Idempotently record media keys as shown in a conversation. */
  async recordMany(
    sessionId: string,
    conversationId: string,
    requestId: string,
    entries: ShownMediaEntry[],
  ): Promise<number> {
    let recorded = 0;
    for (const entry of entries) {
      await this.prisma.harnessShownMedia.upsert({
        where: {
          sessionId_conversationId_kind_mediaKey: {
            sessionId,
            conversationId,
            kind: entry.kind,
            mediaKey: entry.mediaKey,
          },
        },
        create: {
          sessionId,
          conversationId,
          kind: entry.kind,
          mediaKey: entry.mediaKey,
          requestId,
        },
        update: {},
      });
      recorded += 1;
    }
    return recorded;
  }

  /** Every media key recorded for a conversation, one Set per kind. */
  async findKeysByConversation(
    sessionId: string,
    conversationId: string,
  ): Promise<Map<ShownMediaKind, Set<string>>> {
    const rows = await this.prisma.harnessShownMedia.findMany({
      where: { sessionId, conversationId },
      select: { kind: true, mediaKey: true },
    });

    const keys = new Map<ShownMediaKind, Set<string>>();
    for (const row of rows) {
      const set = keys.get(row.kind) ?? new Set<string>();
      set.add(row.mediaKey);
      keys.set(row.kind, set);
    }
    return keys;
  }

  /** Purge everything a conversation was shown (conversation deletion). */
  async deleteByConversation(sessionId: string, conversationId: string) {
    return this.prisma.harnessShownMedia.deleteMany({
      where: { sessionId, conversationId },
    });
  }

  /** Purge everything a session was shown (session deletion). */
  async deleteBySession(sessionId: string) {
    return this.prisma.harnessShownMedia.deleteMany({
      where: { sessionId },
    });
  }
}
