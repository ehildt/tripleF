import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client.js';

import { ConfigRepository } from './config.repository.js';
import type { SessionConfig } from './config.service.types.js';
import { ShownMediaRepository } from './shown-media.repository.js';

@Injectable()
export class ConfigService {
  constructor(
    private readonly repository: ConfigRepository,
    private readonly shownMedia: ShownMediaRepository,
  ) {}

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
      memoryPartition: row.memoryPartition,
      memoryCognition: row.memoryCognition,
    };
  }

  async updateConfig(
    sessionId: string,
    patch: {
      selectedModel?: string;
      preprocessing?: Record<string, unknown>;
      providerOverrides?: Record<string, unknown>;
      memoryPartition?: string | null;
      memoryCognition?: string | null;
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
    if (patch.memoryPartition !== undefined)
      data.memoryPartition = patch.memoryPartition;
    if (patch.memoryCognition !== undefined)
      data.memoryCognition = patch.memoryCognition;

    return this.repository.upsert(sessionId, data);
  }

  async deleteConfig(sessionId: string) {
    // Session deletion purges the shown-media registry for every
    // conversation in the session.
    await this.shownMedia.deleteBySession(sessionId);
    return this.repository.deleteById(sessionId);
  }
}
