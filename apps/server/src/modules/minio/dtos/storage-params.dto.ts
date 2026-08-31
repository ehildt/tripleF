import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Path params for the storage routes (session/conversation, optional hash). */
export class StorageParamsDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  hash?: string;
}
