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
export class ConfigRepository implements OnModuleInit, OnModuleDestroy {
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

  async findById(sessionId: string) {
    return this.prisma.harnessConfig.findUnique({
      where: { sessionId },
    });
  }

  async create(data: Prisma.HarnessConfigCreateInput) {
    return this.prisma.harnessConfig.create({ data });
  }

  async update(sessionId: string, data: Prisma.HarnessConfigUpdateInput) {
    return this.prisma.harnessConfig.update({
      where: { sessionId },
      data,
    });
  }

  async upsert(
    sessionId: string,
    data: Partial<Omit<Prisma.HarnessConfigCreateInput, 'sessionId'>>,
  ) {
    return this.prisma.harnessConfig.upsert({
      where: { sessionId },
      create: { sessionId, ...data },
      update: data as Prisma.HarnessConfigUpdateInput,
    });
  }

  async deleteById(sessionId: string) {
    return this.prisma.harnessConfig.delete({ where: { sessionId } });
  }

  async ping() {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
