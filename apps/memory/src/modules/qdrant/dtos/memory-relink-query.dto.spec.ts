import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { MemoryRelinkQueryDto } from './memory-relink-query.dto.js';

describe('MemoryRelinkQueryDto', () => {
  it('converts query-string numbers and booleans before validation', async () => {
    const dto = plainToInstance(MemoryRelinkQueryDto, {
      memoryPartition: 'christopher',
      limit: '100',
      maxPasses: '3',
      enrich: 'true',
      dryRun: 'true',
    });

    const errors = await validate(dto);

    expect(errors).toEqual([]);
    expect(dto.limit).toBe(100);
    expect(dto.maxPasses).toBe(3);
    expect(dto.enrich).toBe(true);
    expect(dto.dryRun).toBe(true);
  });

  it('accepts absent optional params', async () => {
    const dto = plainToInstance(MemoryRelinkQueryDto, {
      memoryPartition: 'christopher',
    });

    expect(await validate(dto)).toEqual([]);
    expect(dto.limit).toBeUndefined();
    expect(dto.enrich).toBeUndefined();
  });

  it('rejects a non-integer limit', async () => {
    const dto = plainToInstance(MemoryRelinkQueryDto, {
      memoryPartition: 'christopher',
      limit: 'abc',
    });

    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejects a limit above the cap', async () => {
    const dto = plainToInstance(MemoryRelinkQueryDto, {
      memoryPartition: 'christopher',
      limit: '501',
    });

    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('requires memoryPartition', async () => {
    const dto = plainToInstance(MemoryRelinkQueryDto, {});

    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});
