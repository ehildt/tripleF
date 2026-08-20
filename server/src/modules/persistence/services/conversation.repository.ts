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

/** One row of `findLatestBySession`: the latest turn per conversation. The
 * `content` JSONB column arrives as a parsed object through the pg driver. */
interface LatestConversationRow {
  conversationId: string;
  title: string | null;
  content: unknown;
  updatedAt: Date;
}

@Injectable()
export class ConversationRepository implements OnModuleInit, OnModuleDestroy {
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

  async findById(sessionId: string, conversationId: string, requestId: string) {
    return this.prisma.harnessConversation.findUnique({
      where: {
        sessionId_conversationId_requestId: {
          sessionId,
          conversationId,
          requestId,
        },
      },
    });
  }

  async findManyByConversation(sessionId: string, conversationId: string) {
    return this.prisma.harnessConversation.findMany({
      where: { sessionId, conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Latest turn per conversation for a session. Postgres `DISTINCT ON` keeps
   * this at exactly one row per conversation: the previous implementation
   * fetched every turn with its full JSON content (N conversations × M turns)
   * and deduped in JS, which moved all those blobs DB→server for nothing.
   * (Prisma's `distinct` option is avoided — its interaction with a secondary
   * `orderBy` is documented-unreliable.)
   */
  async findLatestBySession(
    sessionId: string,
  ): Promise<LatestConversationRow[]> {
    return this.prisma.$queryRaw<LatestConversationRow[]>`
      SELECT DISTINCT ON ("conversationId") "conversationId", "title", "content", "updatedAt"
      FROM "harness_conversation"
      WHERE "sessionId" = ${sessionId}
      ORDER BY "conversationId" ASC, "updatedAt" DESC
    `;
  }

  async create(data: Prisma.HarnessConversationCreateInput) {
    return this.prisma.harnessConversation.create({ data });
  }

  async update(
    sessionId: string,
    conversationId: string,
    requestId: string,
    data: Prisma.HarnessConversationUpdateInput,
  ) {
    return this.prisma.harnessConversation.update({
      where: {
        sessionId_conversationId_requestId: {
          sessionId,
          conversationId,
          requestId,
        },
      },
      data,
    });
  }

  async upsert(
    sessionId: string,
    conversationId: string,
    requestId: string,
    data: Omit<
      Prisma.HarnessConversationCreateInput,
      'sessionId' | 'conversationId' | 'requestId'
    >,
  ) {
    return this.prisma.harnessConversation.upsert({
      where: {
        sessionId_conversationId_requestId: {
          sessionId,
          conversationId,
          requestId,
        },
      },
      create: {
        sessionId,
        conversationId,
        requestId,
        ...data,
      },
      update: data,
    });
  }

  async deleteByConversation(sessionId: string, conversationId: string) {
    return this.prisma.harnessConversation.deleteMany({
      where: { sessionId, conversationId },
    });
  }

  async deleteById(
    sessionId: string,
    conversationId: string,
    requestId: string,
  ) {
    return this.prisma.harnessConversation.delete({
      where: {
        sessionId_conversationId_requestId: {
          sessionId,
          conversationId,
          requestId,
        },
      },
    });
  }

  async ping() {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
