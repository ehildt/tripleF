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
import { ConversationService } from '../services/conversation.service.js';

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get(':sessionId')
  @ApiOperation({ summary: 'List conversations for a session' })
  async list(@Param('sessionId') sessionId: string) {
    return this.conversationService.listConversations(sessionId);
  }

  @Get(':sessionId/:conversationId')
  @ApiOperation({ summary: 'Get the latest state of one conversation' })
  async getOne(
    @Param('sessionId') sessionId: string,
    @Param('conversationId') conversationId: string,
  ) {
    const conversation = await this.conversationService.getConversation(
      sessionId,
      conversationId,
    );

    if (!conversation) throw new NotFoundException();

    return conversation;
  }

  @Put(':sessionId/:conversationId/:requestId')
  @ApiOperation({ summary: 'Upsert a conversation turn' })
  async upsert(
    @Param('sessionId') sessionId: string,
    @Param('conversationId') conversationId: string,
    @Param('requestId') requestId: string,
    @Body() body: UpsertConversationDto,
  ) {
    return this.conversationService.saveTurn({
      sessionId,
      conversationId,
      requestId,
      title: body.content.title,
      content: body.content as unknown as Record<string, unknown>,
    });
  }

  @Delete(':sessionId/:conversationId')
  @ApiOperation({ summary: 'Delete a conversation and all its turns' })
  async delete(
    @Param('sessionId') sessionId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversationService.deleteConversation(
      sessionId,
      conversationId,
    );
  }

  @Delete(':sessionId/:conversationId/:requestId')
  @ApiOperation({ summary: 'Delete one conversation turn' })
  async deleteTurn(
    @Param('sessionId') sessionId: string,
    @Param('conversationId') conversationId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.conversationService.deleteTurn(
      sessionId,
      conversationId,
      requestId,
    );
  }
}
