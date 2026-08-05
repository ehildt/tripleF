import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client.js';

import { PlaylistRepository } from './playlist.repository.js';

interface PlaylistSnapshot {
  name: string;
  conversationId: string;
  videos: unknown[];
  updatedAt?: Date;
}

@Injectable()
export class PlaylistService {
  constructor(private readonly repository: PlaylistRepository) {}

  async listPlaylists(
    sessionId: string,
    conversationId: string,
  ): Promise<PlaylistSnapshot[]> {
    const playlists = await this.repository.findManyByConversation(
      sessionId,
      conversationId,
    );

    return playlists.map((playlist) => ({
      name: playlist.name,
      conversationId: playlist.conversationId,
      videos: playlist.videos as unknown[],
      updatedAt: playlist.updatedAt,
    }));
  }

  async listAllPlaylists(sessionId: string): Promise<PlaylistSnapshot[]> {
    const playlists = await this.repository.findManyBySession(sessionId);

    return playlists.map((playlist) => ({
      name: playlist.name,
      conversationId: playlist.conversationId,
      videos: playlist.videos as unknown[],
      updatedAt: playlist.updatedAt,
    }));
  }

  async getPlaylist(
    sessionId: string,
    conversationId: string,
    name: string,
  ): Promise<PlaylistSnapshot | null> {
    const playlist = await this.repository.findById(
      sessionId,
      conversationId,
      name,
    );

    if (!playlist) return null;

    return {
      name: playlist.name,
      conversationId: playlist.conversationId,
      videos: playlist.videos as unknown[],
      updatedAt: playlist.updatedAt,
    };
  }

  async savePlaylist(
    sessionId: string,
    conversationId: string,
    name: string,
    videos: unknown[],
  ) {
    return this.repository.upsert(
      sessionId,
      conversationId,
      name,
      videos as Prisma.InputJsonValue,
    );
  }

  async deletePlaylist(
    sessionId: string,
    conversationId: string,
    name: string,
  ) {
    return this.repository.delete(sessionId, conversationId, name);
  }

  async renamePlaylist(
    sessionId: string,
    conversationId: string,
    oldName: string,
    newName: string,
  ) {
    const existing = await this.repository.findById(
      sessionId,
      conversationId,
      newName,
    );
    if (existing) return null;

    const playlist = await this.repository.findById(
      sessionId,
      conversationId,
      oldName,
    );
    if (!playlist) return null;

    await this.repository.delete(sessionId, conversationId, oldName);
    return this.repository.upsert(
      sessionId,
      conversationId,
      newName,
      playlist.videos as Prisma.InputJsonValue,
    );
  }

  async deleteByConversation(sessionId: string, conversationId: string) {
    return this.repository.deleteByConversation(sessionId, conversationId);
  }
}
