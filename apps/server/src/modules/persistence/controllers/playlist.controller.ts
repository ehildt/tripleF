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
import { PlaylistParamsDto } from '../dtos/playlist-params.dto.js';
import { PlaylistService } from '../services/playlist.service.js';

@ApiTags('Playlists')
@Controller('playlists')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get(':sessionId')
  @ApiOperation({ summary: 'List all playlists for a session' })
  async listAll(@Param() params: PlaylistParamsDto) {
    return this.playlistService.listAllPlaylists(params.sessionId);
  }

  @Get(':sessionId/:conversationId')
  @ApiOperation({ summary: 'List playlists for a conversation' })
  async list(@Param() params: PlaylistParamsDto) {
    return this.playlistService.listPlaylists(
      params.sessionId,
      params.conversationId!,
    );
  }

  @Get(':sessionId/:conversationId/:name')
  @ApiOperation({ summary: 'Get one playlist by name' })
  async getOne(@Param() params: PlaylistParamsDto) {
    const playlist = await this.playlistService.getPlaylist(
      params.sessionId,
      params.conversationId!,
      params.name!,
    );

    if (!playlist) throw new NotFoundException();

    return playlist;
  }

  @Put(':sessionId/:conversationId/:name')
  @ApiOperation({ summary: 'Create or update a playlist' })
  async upsert(
    @Param() params: PlaylistParamsDto,
    @Body() body: UpsertPlaylistDto,
  ) {
    return this.playlistService.savePlaylist(
      params.sessionId,
      params.conversationId!,
      params.name!,
      body.videos,
    );
  }

  @Put(':sessionId/:conversationId/:name/rename')
  @ApiOperation({ summary: 'Rename a playlist' })
  async rename(
    @Param() params: PlaylistParamsDto,
    @Body() body: RenamePlaylistDto,
  ) {
    const renamed = await this.playlistService.renamePlaylist(
      params.sessionId,
      params.conversationId!,
      params.name!,
      body.newName,
    );

    if (!renamed) throw new NotFoundException();

    return renamed;
  }

  @Delete(':sessionId/:conversationId/:name')
  @ApiOperation({ summary: 'Delete a playlist' })
  async delete(@Param() params: PlaylistParamsDto) {
    return this.playlistService.deletePlaylist(
      params.sessionId,
      params.conversationId!,
      params.name!,
    );
  }
}
