import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Path params for the conversation routes. */
export class ConversationParamsDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  conversationId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  requestId?: string;
}
