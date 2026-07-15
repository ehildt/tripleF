import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { vi } from 'vitest';

import { HarnessJobPayload } from '../dtos/harness-job.dto.js';

import { HarnessChatStreamingService } from './harness-chat-streaming.service.js';
import { HarnessCompactService } from './harness-compact.service.js';

function createJob(
  filters: HarnessJobPayload['filters'],
): Job<HarnessJobPayload> {
  return {
    name: 'req-1',
    data: { meta: [], filters },
  } as Job<HarnessJobPayload>;
}

describe('HarnessCompactService', () => {
  let service: HarnessCompactService;
  let chatStreaming: HarnessChatStreamingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HarnessCompactService,
        {
          provide: HarnessChatStreamingService,
          useValue: {
            streamCompact: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HarnessCompactService>(HarnessCompactService);
    chatStreaming = module.get<HarnessChatStreamingService>(
      HarnessChatStreamingService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('builds compact messages and delegates to chat streaming', async () => {
    const job = createJob({
      compact: true,
      model: 'model',
      requestId: 'req-1',
      roomId: 'room-1',
      event: 'harness',
      stream: false,
      exchanges: [{ role: 'user', content: 'hello' }],
    });

    await service.runCompact(job, new AbortController().signal);

    expect(chatStreaming.streamCompact).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-1',
        roomId: 'room-1',
        event: 'harness',
        model: 'model',
        stream: false,
        abortSignal: expect.any(AbortSignal),
      }),
    );

    const call = (chatStreaming.streamCompact as any).mock.calls[0][0];
    expect(call.messages[0].role).toBe('system');
    expect(call.messages[0].content).toContain('MODE: COMPACT');
    expect(call.messages[0].content).toContain('Return plain text.');
    expect(call.messages[1]).toEqual({ role: 'user', content: 'hello' });
  });
});
