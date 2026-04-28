import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class Prompt {
  @ApiProperty({ example: 'user' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    example: 'Describe this image in exhaustive visual detail.',
  })
  @IsOptional()
  @IsString()
  content?: string;
}
