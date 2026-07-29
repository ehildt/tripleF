import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client.js';

import { ConfigRepository } from './config.repository.js';

interface SessionConfig {
  sessionId: string;
  selectedModel?: string | null;
  preprocessing?: Record<string, unknown> | null;
  providerOverrides?: Record<string, unknown> | null;
}

@Injectable()
export class ConfigService {
  constructor(private readonly repository: ConfigRepository) {}

  async getConfig(sessionId: string): Promise<SessionConfig | null> {
    const row = await this.repository.findById(sessionId);
    if (!row) return null;

    return {
      sessionId: row.sessionId,
      selectedModel: row.selectedModel,
      preprocessing: row.preprocessing as Record<string, unknown> | null,
      providerOverrides: row.providerOverrides as Record<
        string,
        unknown
      > | null,
    };
  }

  async updateConfig(
    sessionId: string,
    patch: {
      selectedModel?: string;
      preprocessing?: Record<string, unknown>;
      providerOverrides?: Record<string, unknown>;
    },
  ) {
    const data: Partial<Omit<Prisma.HarnessConfigCreateInput, 'sessionId'>> =
      {};

    if (patch.selectedModel !== undefined)
      data.selectedModel = patch.selectedModel;
    if (patch.preprocessing !== undefined)
      data.preprocessing = patch.preprocessing as Prisma.InputJsonValue;
    if (patch.providerOverrides !== undefined)
      data.providerOverrides = patch.providerOverrides as Prisma.InputJsonValue;

    return this.repository.upsert(sessionId, data);
  }

  async deleteConfig(sessionId: string) {
    return this.repository.deleteById(sessionId);
  }
}
