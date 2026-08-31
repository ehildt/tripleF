import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Path params for the playlist routes. */
export class PlaylistParamsDto {
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
  name?: string;
}
