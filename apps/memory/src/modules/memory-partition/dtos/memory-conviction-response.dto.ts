import { ApiProperty } from '@nestjs/swagger';

/** Enqueue-only response: the conviction synthesis runs in the vectorize worker. */
export class MemoryConvictionResponseDto {
  @ApiProperty({ description: 'Always true when the request was accepted.' })
  accepted!: boolean;
}
