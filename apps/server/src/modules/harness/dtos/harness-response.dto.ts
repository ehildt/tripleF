import { ApiProperty } from '@nestjs/swagger';

import { SocketInfo } from '../../socket-io/dtos/socket-info.dto.js';

export class HarnessControllerResponse {
  @ApiProperty({ type: SocketInfo })
  realtime!: SocketInfo;
}
