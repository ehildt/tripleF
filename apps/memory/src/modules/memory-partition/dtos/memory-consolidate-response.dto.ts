import { ApiProperty } from '@nestjs/swagger';

/** Enqueue-only response: the sweep runs in the vectorize worker. */
export class MemoryConsolidateResponseDto {
  @ApiProperty({ description: 'Always true when the request was accepted.' })
  accepted!: boolean;

  @ApiProperty({
    type: [Object],
    description:
      'Partitions enqueued for a sweep, with their pending-insert counts.',
  })
  sweeps!: Array<{ memoryPartition: string; pending: number }>;
}
