import { ApiProperty } from '@nestjs/swagger';

/** Enqueue-only response: the relink sweep runs in the vectorize worker. */
export class MemoryRelinkResponseDto {
  @ApiProperty({ description: 'Always true when the request was accepted.' })
  accepted!: boolean;
}
