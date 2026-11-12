import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MemoryItemDto } from '../../qdrant/dtos/memory-item.dto.js';

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
    type: Object,
    description:
      'Normalized 0..1 retrieval heat by profile routing path (for example likes.cars), derived from path-linked insights. Missing paths are cold and neutral, not false or unsupported.',
    example: { 'likes.cars': 0.71 },
  })
  profileHeat!: Record<string, number>;

  @ApiProperty({
    type: Number,
    description:
      'Effective episode probe limit (system variable) — max short-term conversation-memory records the harness injects per turn.',
    example: 3,
  })
  episodeProbeLimit!: number;
}
