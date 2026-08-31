import { IsNotEmpty, IsString } from 'class-validator';

/** Path params for the persisted-config routes. */
export class ConfigParamsDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}
