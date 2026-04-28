import { ApiProperty } from '@nestjs/swagger';

import { RealtimeInfo } from '../realtime-info.dto.js';

export class ClassicControllerResponse {
  @ApiProperty({ type: RealtimeInfo })
  realtime!: RealtimeInfo;
}
