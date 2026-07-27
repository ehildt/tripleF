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

  async findDistinctConversations(sessionId: string) {
    return this.prisma.harnessConversation.groupBy({
      by: ['conversationId'],
      where: { sessionId },
      _max: { updatedAt: true, title: true },
    });
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
