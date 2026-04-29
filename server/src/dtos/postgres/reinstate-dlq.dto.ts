import { IsArray, IsOptional, IsString } from 'class-validator';

export class ReinstateDlqDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requestIds?: string[];
}
