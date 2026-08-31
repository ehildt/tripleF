import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client.js';

import { mapConversationSnapshot } from './helpers/map-conversation-snapshot.helper.js';
import { ConversationRepository } from './conversation.repository.js';
import type {
  ConversationSnapshot,
  ConversationTurn,
  MergedConversation,
} from './conversation.service.types.js';
import { PlaylistService } from './playlist.service.js';
import { ShownMediaRepository } from './shown-media.repository.js';

@Injectable()
export class ConversationService {
  constructor(
    private readonly repository: ConversationRepository,
    private readonly shownMedia: ShownMediaRepository,
    private readonly playlists: PlaylistService,
  ) {}

  async listConversations(sessionId: string): Promise<ConversationSnapshot[]> {
    const latestTurns = await this.repository.findLatestBySession(sessionId);

    return latestTurns.map(mapConversationSnapshot);
  }

  async getConversation(
    sessionId: string,
    conversationId: string,
  ): Promise<MergedConversation | null> {
    const turns = await this.repository.findManyByConversation(
      sessionId,
      conversationId,
    );

    if (turns.length === 0) return null;

    const latest = turns[turns.length - 1];

    return {
      sessionId,
      conversationId,
      latestRequestId: latest.requestId,
      title: latest.title,
      content: latest.content as Record<string, unknown>,
      updatedAt: latest.updatedAt,
    };
  }

  async saveTurn(turn: ConversationTurn) {
    return this.repository.upsert(
      turn.sessionId,
      turn.conversationId,
      turn.requestId,
      {
        title: turn.title,
        content: turn.content as Prisma.InputJsonValue,
      },
    );
  }

  async deleteConversation(sessionId: string, conversationId: string) {
    // Purge the shown-media registry with the conversation — leftovers
    // would forever block fresh images/videos in any recreated
    // conversation sharing the id.
    await this.shownMedia.deleteByConversation(sessionId, conversationId);
    // Purge the conversation's playlists too.
    await this.playlists.deleteByConversation(sessionId, conversationId);
    return this.repository.deleteByConversation(sessionId, conversationId);
  }

  async deleteTurn(
    sessionId: string,
    conversationId: string,
    requestId: string,
  ) {
    return this.repository.deleteById(sessionId, conversationId, requestId);
  }
}
