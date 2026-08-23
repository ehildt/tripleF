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

/**
 * Database access for globally persisted provider overrides (serper,
 * ollama, sources). The `values` JSON holds the raw overrides record with
 * apiKey fields already encrypted by the caller — this repository never
 * sees plaintext secrets.
 */
@Injectable()
export class ProviderOverridesRepository
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

  async findAll() {
    return this.prisma.harnessProviderOverride.findMany();
  }

  async upsert(provider: string, values: Record<string, unknown>) {
    const data = values as Prisma.InputJsonValue;
    return this.prisma.harnessProviderOverride.upsert({
      where: { provider },
      create: { provider, values: data },
      update: { values: data },
    });
  }

  async deleteByProvider(provider: string) {
    return (
      this.prisma.harnessProviderOverride
        .delete({ where: { provider } })
        // A reset also fires when nothing was persisted yet — that is fine.
        .catch(() => null)
    );
  }
}
