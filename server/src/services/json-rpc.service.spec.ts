import { BadRequestException } from '@nestjs/common';

import { SocketIOConfigService } from '../configs/socket-io-config.service.js';
// ! there shouldn't be any env in libs
// it breaks the tests and code
import { JSON_RPC_TOOLS_LIST } from '../constants/json-rpc.constants.js';

import { AnalyzeImageService } from './analyze-image.service.js';
import { JsonRpcService } from './json-rpc.service.js';

describe('JsonRpcService', () => {
  let service: JsonRpcService;
  let analyzeImageService: AnalyzeImageService;
  let socketIOConfigService: SocketIOConfigService;

  beforeEach(() => {
    analyzeImageService = { emit: vi.fn() } as any;
    socketIOConfigService = {
      config: { event: 'vision' },
    } as any;
    service = new JsonRpcService(analyzeImageService, socketIOConfigService);
  });

  describe('getRequestedTools', () => {
    it('returns full list if no requestedTools provided', async () => {
      const req = { params: {} };
      const result = await service.getRequestedTools(req as any);
      expect(result).toEqual(JSON_RPC_TOOLS_LIST);
    });

    it('throws BadRequestException if a requested tool is invalid', async () => {
      const req = { params: { requestedTools: ['invalidTool'] } };
      await expect(service.getRequestedTools(req as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('filters tools correctly for valid requestedTools', async () => {
      const validTool = JSON_RPC_TOOLS_LIST.result.tools[0].name;
      const req = { params: { requestedTools: [validTool] } };
      const result = await service.getRequestedTools(req as any);
      expect(result.result.tools).toHaveLength(1);
      expect(result.result.tools[0].name).toBe(validTool);
    });

    it('throws BadRequestException if requestedTools is empty array', async () => {
      const req = { params: { requestedTools: [] } };
      const result = await service.getRequestedTools(req as any);
      expect(result).toEqual(JSON_RPC_TOOLS_LIST);
    });
  });

  describe('toFilePayloads', () => {
    it('returns array of buffers and meta objects', async () => {
      const requestId = 'batch123';
      const mockFiles = [
        {
          filename: 'file1.png',
          mimetype: 'image/png',
          toBuffer: vi.fn().mockResolvedValue(Buffer.from('data1')),
        },
        {
          filename: 'file2.jpg',
          mimetype: 'image/jpeg',
          toBuffer: vi.fn().mockResolvedValue(Buffer.from('data2')),
        },
      ] as any;

      const result = await service.toFilePayloads(requestId, mockFiles);

      expect(result).toHaveLength(2);
      expect(result[0].meta.name).toBe('file1.png');
      expect(result[0].meta.type).toBe('image/png');
      expect(result[0].meta.hash).toMatch(/^[a-f0-9]{64}_batch123$/);

      expect(result[1].meta.name).toBe('file2.jpg');
      expect(result[1].meta.type).toBe('image/jpeg');
      expect(result[1].meta.hash).toMatch(/^[a-f0-9]{64}_batch123$/);
    });

    it('handles empty file array', async () => {
      const result = await service.toFilePayloads('batch123', []);
      expect(result).toEqual([]);
    });
  });

  describe('analyze', () => {
    it('calls analyzeImageService.emit with correct parameters', async () => {
      const req = {
        buffers: ['buf1', 'buf2'],
        meta: ['meta1', 'meta2'],
        filters: ['filter1'],
      } as any;

      await service.analyze(req);

      expect(analyzeImageService.emit).toHaveBeenCalledTimes(1);
      expect(analyzeImageService.emit).toHaveBeenCalledWith(req);
    });

    it('handles empty buffers, meta, and filters gracefully', async () => {
      const req = { buffers: [], meta: [], filters: [] } as any;

      await service.analyze(req);
      expect(analyzeImageService.emit).toHaveBeenCalledWith(req);
    });
  });
});
