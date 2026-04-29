import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import type { PostgresConfig } from '../configs/postgres-config.adapter.js';
import { POSTGRES_CONFIG } from '../constants/postgres.constants.js';
import { Prisma, PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PostgresService implements OnModuleInit, OnModuleDestroy {
  private _prisma: PrismaClient | null = null;

  constructor(
    @Inject(POSTGRES_CONFIG)
    private readonly _config: PostgresConfig,
  ) {}

  get prisma() {
    return this._prisma as PrismaClient;
  }

  get config() {
    return this._config;
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

  async findAll(options: {
    status?: string;
    queueName?: string;
    nextRetryAtBefore?: Date;
    nextRetryAtAfter?: Date;
    limit?: number;
    offset?: number;
    requestId?: string;
    search?: string;
  }) {
    const where: Prisma.VisionsDlqWhereInput = {};

    if (options.status)
      where.status = options.status as Prisma.VisionsDlqWhereInput['status'];

    if (options.queueName)
      where.queueName = { contains: options.queueName, mode: 'insensitive' };

    if (options.nextRetryAtBefore)
      where.nextRetryAt = { lte: options.nextRetryAtBefore };

    if (options.nextRetryAtAfter) {
      if (where.nextRetryAt && typeof where.nextRetryAt === 'object')
        Object.assign(where.nextRetryAt, { gte: options.nextRetryAtAfter });
      else where.nextRetryAt = { gte: options.nextRetryAtAfter };
    }

    if (options.requestId)
      where.requestId = { contains: options.requestId, mode: 'insensitive' };

    if (options.search) {
      const searchTerm = `%${options.search}%`;
      where.OR = [
        { requestId: { contains: options.search, mode: 'insensitive' } },
        { queueName: { contains: options.search, mode: 'insensitive' } },
        { failedReason: { contains: options.search, mode: 'insensitive' } },
      ];

      const jsonRows = await this.prisma.$queryRaw<
        Array<{ requestId: string }>
      >(
        Prisma.sql`SELECT "requestId" FROM "visions_dlq" WHERE "payload"::text ILIKE ${searchTerm}`,
      );

      if (jsonRows.length > 0) {
        const requestIds = jsonRows.map((r) => r.requestId);
        if (!where.OR) where.OR = [];
        where.OR.push({ requestId: { in: requestIds } });
      }
    }

    const [rows, total] = await Promise.all([
      this.prisma.visionsDlq.findMany({
        where,
        take: options.limit ?? 50,
        skip: options.offset ?? 0,
      }),
      this.prisma.visionsDlq.count({ where }),
    ]);

    return {
      data: rows,
      total,
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    };
  }

  async findById(requestId: string) {
    return this.prisma.visionsDlq.findUnique({
      where: { requestId },
    });
  }

  async create(data: Prisma.VisionsDlqCreateInput) {
    return this.prisma.visionsDlq.create({ data });
  }

  async update(requestId: string, data: Prisma.VisionsDlqUpdateInput) {
    return this.prisma.visionsDlq.update({
      where: { requestId },
      data,
    });
  }

  async upsert(
    requestId: string,
    data: Partial<Omit<Prisma.VisionsDlqCreateInput, 'requestId'>>,
  ) {
    const existing = await this.findById(requestId);

    if (!existing) {
      return this.create({
        requestId,
        queueName: data.queueName ?? 'unknown',
        payload: (data.payload ?? {}) as Prisma.InputJsonValue,
        status:
          (data.status satisfies Prisma.VisionsDlqCreateInput['status']) ??
          'PENDING_RETRY',
        ...data,
      } satisfies Prisma.VisionsDlqCreateInput);
    }

    const failureEntry = {
      failedAt: new Date().toISOString(),
      failedReason: data.failedReason ?? existing.failedReason,
      attemptsMade: (existing.attemptsMade ?? 0) + 1,
    };

    const failureHistory = [
      ...((existing.failureHistory as Array<Record<string, unknown>> | null) ??
        []),
      failureEntry,
    ];

    return this.prisma.visionsDlq.update({
      where: { requestId },
      data: {
        ...data,
        totalAttempts: (existing.totalAttempts ?? 0) + 1,
        failureHistory: failureHistory as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
  }

  async remove(requestId: string) {
    return this.update(requestId, { status: 'PENDING_DELETION' });
  }

  async findEligible(
    status: string,
    retainAmount: number,
    olderThanMs: number,
  ) {
    const cutoff = new Date(Date.now() - olderThanMs);

    return this.prisma.visionsDlq.findMany({
      where: {
        status: status as Prisma.VisionsDlqWhereInput['status'],
        createdAt: { lt: cutoff },
      },
      orderBy: { createdAt: 'desc' },
      skip: retainAmount,
    });
  }

  async moveStatus(requestIds: string[], newStatus: string) {
    if (!requestIds.length) return { moved: 0 };

    const result = await this.prisma.visionsDlq.updateMany({
      where: { requestId: { in: requestIds } },
      data: {
        status: newStatus as Prisma.VisionsDlqUpdateInput['status'],
        updatedAt: new Date(),
      },
    });

    return { moved: result.count };
  }

  async hardDeleteMany(requestIds: string[]) {
    if (!requestIds.length) return { count: 0 };

    const result = await this.prisma.visionsDlq.deleteMany({
      where: { requestId: { in: requestIds } },
    });

    return { count: result.count };
  }

  async ping() {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
