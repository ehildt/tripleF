import { IsNotEmpty, IsString } from 'class-validator';

/** Path params for the single-record DLQ routes (`:id`). */
export class DlqParamsDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}
