import { ApiProperty } from '@nestjs/swagger';

export class RealtimeInfo {
  @ApiProperty({ example: 'vision', type: String })
  event!: string;

  @ApiProperty({ example: 'room-123', required: false, type: String })
  roomId?: string;

  @ApiProperty({
    example: '1234',
    description:
      'Request identifier provided by client for correlating responses',
  })
  requestId!: string;
}
