import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { Prisma, PrismaClient } from '../../../generated/prisma/client.js';
import type { PostgresConfig } from '../../postgres/configs/postgres-config.adapter.js';
import { POSTGRES_CONFIG } from '../../postgres/constants/postgres.constants.js';

import type { FindAllOptions } from './repository.service.types.js';

@Injectable()
export class DeadLetterRepository implements OnModuleInit, OnModuleDestroy {
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

  async findAll(options: FindAllOptions) {
    const where: Prisma.DeadLetterJobWhereInput = {};

    if (options.status)
      where.status = options.status as Prisma.DeadLetterJobWhereInput['status'];

    if (options.queueName)
      where.queueName = { contains: options.queueName, mode: 'insensitive' };

    if (options.nextRetryAtBefore)
      where.nextRetryAt = { lte: options.nextRetryAtBefore };

    if (options.nextRetryAtAfter) {
      if (where.nextRetryAt && typeof where.nextRetryAt === 'object')
        Object.assign(where.nextRetryAt, { gte: options.nextRetryAtAfter });
      else where.nextRetryAt = { gte: options.nextRetryAtAfter };
    }

    if (options.jobName)
      where.jobName = { contains: options.jobName, mode: 'insensitive' };

    if (options.search) {
      const searchTerm = `%${options.search}%`;
      where.OR = [
        { jobName: { contains: options.search, mode: 'insensitive' } },
        { queueName: { contains: options.search, mode: 'insensitive' } },
        { failedReason: { contains: options.search, mode: 'insensitive' } },
      ];

      const jsonRows = await this.prisma.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`SELECT "id" FROM "dead_letter_job" WHERE "payload"::text ILIKE ${searchTerm}`,
      );

      if (jsonRows.length > 0)
        where.OR.push({ id: { in: jsonRows.map((r) => r.id) } });
    }

    const [rows, total] = await Promise.all([
      this.prisma.deadLetterJob.findMany({
        where,
        take: options.limit ?? 50,
        skip: options.offset ?? 0,
      }),
      this.prisma.deadLetterJob.count({ where }),
    ]);

    return {
      data: rows,
      total,
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    };
  }

  async findById(id: string) {
    return this.prisma.deadLetterJob.findUnique({
      where: { id },
    });
  }

  async findByQueueJob(queueName: string, jobId: string) {
    return this.prisma.deadLetterJob.findUnique({
      where: { queueName_jobId: { queueName, jobId } },
    });
  }

  async create(data: Prisma.DeadLetterJobCreateInput) {
    return this.prisma.deadLetterJob.create({ data });
  }

  async update(id: string, data: Prisma.DeadLetterJobUpdateInput) {
    return this.prisma.deadLetterJob.update({
      where: { id },
      data,
    });
  }

  /**
   * Upsert keyed by the technical job identity (queueName + jobId). Repeated
   * failures of the same logical job accumulate into failureHistory and bump
   * the attempt counters (reinstate refreshes jobId, keeping one record per
   * logical job across cycles).
   */
  async upsertByQueueJob(
    input: {
      queueName: string;
      jobId: string;
      jobName: string;
    },
    data: Partial<Prisma.DeadLetterJobCreateInput>,
  ) {
    const existing = await this.findByQueueJob(input.queueName, input.jobId);

    if (!existing) {
      return this.create({
        queueName: input.queueName,
        jobId: input.jobId,
        jobName: input.jobName,
        payload: (data.payload ?? {}) as Prisma.InputJsonValue,
        status:
          (data.status satisfies Prisma.DeadLetterJobCreateInput['status']) ??
          'Failed',
        ...data,
      } satisfies Prisma.DeadLetterJobCreateInput);
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

    return this.prisma.deadLetterJob.update({
      where: { id: existing.id },
      data: {
        ...data,
        totalAttempts: (existing.totalAttempts ?? 0) + 1,
        failureHistory: failureHistory as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string) {
    return this.update(id, { status: 'Removed' });
  }

  async findEligible(
    status: string,
    retainAmount: number,
    olderThanMs: number,
  ) {
    const cutoff = new Date(Date.now() - olderThanMs);

    return this.prisma.deadLetterJob.findMany({
      where: {
        status: status as Prisma.DeadLetterJobWhereInput['status'],
        createdAt: { lt: cutoff },
      },
      orderBy: { createdAt: 'desc' },
      skip: retainAmount,
    });
  }

  async moveStatus(ids: string[], newStatus: string) {
    if (!ids.length) return { moved: 0 };

    const result = await this.prisma.deadLetterJob.updateMany({
      where: { id: { in: ids } },
      data: {
        status: newStatus as Prisma.DeadLetterJobUpdateInput['status'],
        updatedAt: new Date(),
      },
    });

    return { moved: result.count };
  }

  async hardDeleteMany(ids: string[]) {
    if (!ids.length) return { count: 0 };

    const result = await this.prisma.deadLetterJob.deleteMany({
      where: { id: { in: ids } },
    });

    return { count: result.count };
  }

  async ping() {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
