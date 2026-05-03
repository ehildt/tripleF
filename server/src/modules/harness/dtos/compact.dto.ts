import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class CompactExchange {
  @ApiProperty({ example: 'user' })
  @IsString()
  role!: string;

  @ApiProperty({ example: 'Tell me about this image.' })
  @IsString()
  content!: string;
}

export class CompactRequestDto {
  @ApiProperty({
    description: 'The conversation exchanges to compact',
    type: [CompactExchange],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompactExchange)
  exchanges!: CompactExchange[];

  @ApiProperty({ example: 'llama3.2-vision:latest' })
  @IsString()
  model!: string;

  @ApiProperty({ example: 'req-abc123' })
  @IsString()
  requestId!: string;

  @ApiPropertyOptional({ example: 'room-1' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiProperty({ example: 'harness' })
  @IsString()
  event!: string;

  @ApiPropertyOptional({
    description:
      'Controls the thinking/reasoning visibility. Accepts: off, low, medium, high, or boolean true/false.',
    default: 'medium',
    example: 'medium',
  })
  @IsOptional()
  @IsString()
  think?: string;

  @ApiPropertyOptional({ example: '5m' })
  @IsOptional()
  @IsString()
  keepAlive?: string;

  @ApiPropertyOptional({ example: 65536 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  numCtx?: number;
}

export class CompactResponseDto {
  @ApiProperty({
    example: { event: 'harness', roomId: 'room-1', requestId: 'req-abc123' },
  })
  realtime!: {
    event: string;
    roomId?: string;
    requestId: string;
  };
}
