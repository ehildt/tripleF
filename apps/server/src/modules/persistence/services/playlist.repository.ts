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
export class PlaylistRepository implements OnModuleInit, OnModuleDestroy {
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

  async findManyByConversation(sessionId: string, conversationId: string) {
    return this.prisma.harnessPlaylist.findMany({
      where: { sessionId, conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findManyBySession(sessionId: string) {
    return this.prisma.harnessPlaylist.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(sessionId: string, conversationId: string, name: string) {
    return this.prisma.harnessPlaylist.findUnique({
      where: {
        sessionId_conversationId_name: {
          sessionId,
          conversationId,
          name,
        },
      },
    });
  }

  async upsert(
    sessionId: string,
    conversationId: string,
    name: string,
    videos: Prisma.InputJsonValue,
  ) {
    return this.prisma.harnessPlaylist.upsert({
      where: {
        sessionId_conversationId_name: {
          sessionId,
          conversationId,
          name,
        },
      },
      create: { sessionId, conversationId, name, videos },
      update: { videos },
    });
  }

  async delete(sessionId: string, conversationId: string, name: string) {
    return this.prisma.harnessPlaylist.delete({
      where: {
        sessionId_conversationId_name: {
          sessionId,
          conversationId,
          name,
        },
      },
    });
  }

  async deleteByConversation(sessionId: string, conversationId: string) {
    return this.prisma.harnessPlaylist.deleteMany({
      where: { sessionId, conversationId },
    });
  }
}
