import { ApiProperty } from '@nestjs/swagger';

/** Enqueue-only response: the cluster sweep runs in the vectorize worker. */
export class MemoryClusterResponseDto {
  @ApiProperty({ description: 'Always true when the request was accepted.' })
  accepted!: boolean;
}
