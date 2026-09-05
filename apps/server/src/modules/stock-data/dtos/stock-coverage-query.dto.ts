import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

/** Query params for the stock-data coverage endpoint. */
export class StockCoverageQueryDto {
  @ApiProperty({ example: 'AAPL', description: 'Ticker symbol.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  ticker!: string;
}
