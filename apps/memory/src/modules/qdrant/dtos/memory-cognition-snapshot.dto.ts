import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MemoryItemDto } from './memory-item.dto.js';

/** The AI's cognition of one space: the structured profile document plus the derived insight records. */
export class MemoryCognitionSnapshotDto {
  @ApiPropertyOptional({
    description:
      'The structured profile document (serialized JSON) — null when nothing learned yet.',
    example: '{"name":"Sam","likes":["cars"]}',
  })
  profile!: string | null;

  @ApiProperty({
    type: [MemoryItemDto],
    description:
      'Derived insight records (topic-probed at respond time, path-routed into the profile).',
  })
  insights!: MemoryItemDto[];

  @ApiProperty({
    type: [MemoryItemDto],
    description:
      "Conviction records (the AI's synthesized conclusions about the user/self model, probed at respond time; evidence_ids cite the partition facts they rest on).",
  })
  convictions!: MemoryItemDto[];

  @ApiProperty({
    type: Number,
    description:
      'Effective episode probe limit (system variable) — max short-term conversation-memory records the harness injects per turn.',
    example: 3,
  })
  episodeProbeLimit!: number;
}
