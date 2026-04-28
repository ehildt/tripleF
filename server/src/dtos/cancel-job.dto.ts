import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CancelJobDto {
  @ApiProperty({
    description: 'The request ID of the job to cancel',
    example: 'ax25',
  })
  @IsString()
  requestId!: string;
}

export class CancelJobResponseDto {
  @ApiProperty({
    description: 'Whether the cancel was successful',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Message about the cancel result',
    example: 'Job canceled successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'The request ID that was canceled',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  requestId!: string;
}
