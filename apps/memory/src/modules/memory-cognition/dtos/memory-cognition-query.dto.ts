import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

/** Query params for the cognition snapshot endpoint. */
export class MemoryCognitionQueryDto {
  @ApiProperty({
    description: "The AI's cognition space key.",
    example: 'default',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  memoryCognition!: string;
}
