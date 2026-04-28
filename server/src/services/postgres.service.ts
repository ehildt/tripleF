import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import type { PostgresConfig } from '../configs/postgres-config.adapter.js';
import { POSTGRES_CONFIG } from '../constants/postgres.constants.js';

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
    this._prisma = new PrismaClient({
      datasources: {
        db: {
          url: this._config.url,
        },
      },
    });
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
      stacktrace: data.stacktrace ?? existing.stacktrace,
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
    return this.prisma.visionsDlq.delete({
      where: { requestId },
    });
  }

  async ping() {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
