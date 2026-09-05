import { ApiProperty } from '@nestjs/swagger';

/** Enqueue-only response: the reflection sweep runs in the vectorize worker. */
export class MemoryReflectResponseDto {
  @ApiProperty({ description: 'Always true when the request was accepted.' })
  accepted!: boolean;
}
