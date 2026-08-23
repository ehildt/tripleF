import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RenamePlaylistDto, UpsertPlaylistDto } from '../dtos/playlist.dto.js';
import { PlaylistService } from '../services/playlist.service.js';

@ApiTags('Playlists')
@Controller('playlists')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get(':sessionId')
  @ApiOperation({ summary: 'List all playlists for a session' })
  async listAll(@Param('sessionId') sessionId: string) {
    return this.playlistService.listAllPlaylists(sessionId);
  }

  @Get(':sessionId/:conversationId')
  @ApiOperation({ summary: 'List playlists for a conversation' })
  async list(
    @Param('sessionId') sessionId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.playlistService.listPlaylists(sessionId, conversationId);
  }

  @Get(':sessionId/:conversationId/:name')
  @ApiOperation({ summary: 'Get one playlist by name' })
  async getOne(
    @Param('sessionId') sessionId: string,
    @Param('conversationId') conversationId: string,
    @Param('name') name: string,
  ) {
    const playlist = await this.playlistService.getPlaylist(
      sessionId,
      conversationId,
      name,
    );

    if (!playlist) throw new NotFoundException();

    return playlist;
  }

  @Put(':sessionId/:conversationId/:name')
  @ApiOperation({ summary: 'Create or update a playlist' })
  async upsert(
    @Param('sessionId') sessionId: string,
    @Param('conversationId') conversationId: string,
    @Param('name') name: string,
    @Body() body: UpsertPlaylistDto,
  ) {
    return this.playlistService.savePlaylist(
      sessionId,
      conversationId,
      name,
      body.videos,
    );
  }

  @Put(':sessionId/:conversationId/:name/rename')
  @ApiOperation({ summary: 'Rename a playlist' })
  async rename(
    @Param('sessionId') sessionId: string,
    @Param('conversationId') conversationId: string,
    @Param('name') name: string,
    @Body() body: RenamePlaylistDto,
  ) {
    const renamed = await this.playlistService.renamePlaylist(
      sessionId,
      conversationId,
      name,
      body.newName,
    );

    if (!renamed) throw new NotFoundException();

    return renamed;
  }

  @Delete(':sessionId/:conversationId/:name')
  @ApiOperation({ summary: 'Delete a playlist' })
  async delete(
    @Param('sessionId') sessionId: string,
    @Param('conversationId') conversationId: string,
    @Param('name') name: string,
  ) {
    return this.playlistService.deletePlaylist(sessionId, conversationId, name);
  }
}
