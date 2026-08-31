import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/** Scope for the partition cluster read — one partition key. */
export class MemoryClustersQueryDto {
  @ApiProperty({
    description: "The user's fact partition to list clusters for.",
    example: 'default',
  })
  @IsString()
  memoryPartition!: string;
}
