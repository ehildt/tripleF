import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Path params for object-storage routes (session/conversation, optional hash). */
export class ObjectStorageParamsDto {
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
