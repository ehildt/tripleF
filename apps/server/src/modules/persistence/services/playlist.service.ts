import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client.js';

import { mapPlaylistSnapshot } from './helpers/map-playlist-snapshot.helper.js';
import { PlaylistRepository } from './playlist.repository.js';
import type { PlaylistSnapshot } from './playlist.service.types.js';

@Injectable()
export class PlaylistService {
  constructor(private readonly repository: PlaylistRepository) {}

  async listAllPlaylists(sessionId: string): Promise<PlaylistSnapshot[]> {
    const playlists = await this.repository.findManyBySession(sessionId);

    return playlists.map(mapPlaylistSnapshot);
  }

  async getPlaylist(
    sessionId: string,
    name: string,
  ): Promise<PlaylistSnapshot | null> {
    const playlist = await this.repository.findById(sessionId, name);

    if (!playlist) return null;

    return {
      name: playlist.name,
      videos: playlist.videos as unknown[],
      updatedAt: playlist.updatedAt,
    };
  }

  async savePlaylist(sessionId: string, name: string, videos: unknown[]) {
    return this.repository.upsert(
      sessionId,
      name,
      videos as Prisma.InputJsonValue,
    );
  }

  async deletePlaylist(sessionId: string, name: string) {
    return this.repository.delete(sessionId, name);
  }

  async renamePlaylist(sessionId: string, oldName: string, newName: string) {
    const existing = await this.repository.findById(sessionId, newName);
    if (existing) return null;

    const playlist = await this.repository.findById(sessionId, oldName);
    if (!playlist) return null;

    await this.repository.delete(sessionId, oldName);
    return this.repository.upsert(
      sessionId,
      newName,
      playlist.videos as Prisma.InputJsonValue,
    );
  }
}
