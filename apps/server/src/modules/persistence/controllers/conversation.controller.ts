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

import { UpsertConversationDto } from '../dtos/conversation.dto.js';
import { ConversationParamsDto } from '../dtos/conversation-params.dto.js';
import { ConversationService } from '../services/conversation.service.js';

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get(':sessionId')
  @ApiOperation({ summary: 'List conversations for a session' })
  async list(@Param() params: ConversationParamsDto) {
    return this.conversationService.listConversations(params.sessionId);
  }

  @Get(':sessionId/:conversationId')
  @ApiOperation({ summary: 'Get the latest state of one conversation' })
  async getOne(@Param() params: ConversationParamsDto) {
    const conversation = await this.conversationService.getConversation(
      params.sessionId,
      params.conversationId!,
    );

    if (!conversation) throw new NotFoundException();

    return conversation;
  }

  @Put(':sessionId/:conversationId/:requestId')
  @ApiOperation({ summary: 'Upsert a conversation turn' })
  async upsert(
    @Param() params: ConversationParamsDto,
    @Body() body: UpsertConversationDto,
  ) {
    return this.conversationService.saveTurn({
      sessionId: params.sessionId,
      conversationId: params.conversationId!,
      requestId: params.requestId!,
      title: body.content.title,
      content: body.content as unknown as Record<string, unknown>,
    });
  }

  @Delete(':sessionId/:conversationId')
  @ApiOperation({ summary: 'Delete a conversation and all its turns' })
  async delete(@Param() params: ConversationParamsDto) {
    return this.conversationService.deleteConversation(
      params.sessionId,
      params.conversationId!,
    );
  }

  @Delete(':sessionId/:conversationId/:requestId')
  @ApiOperation({ summary: 'Delete one conversation turn' })
  async deleteTurn(@Param() params: ConversationParamsDto) {
    return this.conversationService.deleteTurn(
      params.sessionId,
      params.conversationId!,
      params.requestId!,
    );
  }
}
