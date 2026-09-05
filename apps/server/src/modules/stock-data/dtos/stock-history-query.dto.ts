import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Query params for the stock-data history endpoint. */
export class StockHistoryQueryDto {
  @ApiProperty({ example: 'AAPL', description: 'Ticker symbol.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  ticker!: string;

  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Start date (YYYY-MM-DD). Defaults to a 3-month lookback.',
  })
  @IsOptional()
  @Matches(DATE_PATTERN)
  from?: string;

  @ApiPropertyOptional({
    example: '2025-04-01',
    description: 'End date (YYYY-MM-DD). Defaults to today.',
  })
  @IsOptional()
  @Matches(DATE_PATTERN)
  to?: string;
}
