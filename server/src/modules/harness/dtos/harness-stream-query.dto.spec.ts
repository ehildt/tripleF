import { plainToInstance } from 'class-transformer';
import { describe, expect, it } from 'vitest';

import { HarnessStreamQueryDto } from './harness-stream-query.dto.js';

function parse(patch: Record<string, unknown>): HarnessStreamQueryDto {
  return plainToInstance(HarnessStreamQueryDto, {
    requestId: 'r1',
    event: 'harness',
    think: 'medium',
    ...patch,
  } as object);
}

describe('HarnessStreamQueryDto boolean parsing', () => {
  // Query params arrive as strings. class-transformer's @Type(() => Boolean)
  // runs Boolean('false') === true, which silently upgraded stream=false to
  // true and made non-stream mode unreachable. The @Transform guard parses
  // the string explicitly — keep these cases locked in.
  it('parses stream="false" as false', () => {
    expect(parse({ stream: 'false' }).stream).toBe(false);
  });

  it('parses stream="true" as true', () => {
    expect(parse({ stream: 'true' }).stream).toBe(true);
  });

  it('parses hasNewImages="false" as false', () => {
    expect(parse({ stream: 'false', hasNewImages: 'false' }).hasNewImages).toBe(
      false,
    );
  });

  it('parses hasNewImages="true" as true', () => {
    expect(parse({ stream: 'false', hasNewImages: 'true' }).hasNewImages).toBe(
      true,
    );
  });
});
