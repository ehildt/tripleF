import { Readable } from 'node:stream';

import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { ObjectStorageService } from '../services/object-storage.service.js';

import { ObjectStorageController } from './object-storage.controller.js';

describe('ObjectStorageController', () => {
  let controller: ObjectStorageController;
  let objectStorage: {
    config: {
      bucket: string;
      endpoint: string;
      region: string;
    };
    listObjectKeys: ReturnType<typeof vi.fn>;
    getObjectStreamAndMeta: ReturnType<typeof vi.fn>;
    objectExists: ReturnType<typeof vi.fn>;
    deleteObject: ReturnType<typeof vi.fn>;
    deleteObjectKeys: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    objectStorage = {
      config: {
        bucket: 'test-bucket',
        endpoint: 'http://localhost:9000',
        region: 'us-east-1',
      },
      listObjectKeys: vi.fn(),
      getObjectStreamAndMeta: vi.fn(),
      objectExists: vi.fn(),
      deleteObject: vi.fn(),
      deleteObjectKeys: vi.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [ObjectStorageController],
      providers: [{ provide: ObjectStorageService, useValue: objectStorage }],
    }).compile();

    controller = module.get(ObjectStorageController);
  });

  it('returns object-storage bucket information', () => {
    expect(controller.info()).toEqual(objectStorage.config);
  });

  it('lists objects under the session/conversation prefix', async () => {
    objectStorage.listObjectKeys.mockResolvedValue(['images/s/c/a.bin']);
    await expect(
      controller.list({ sessionId: 's', conversationId: 'c' }),
    ).resolves.toEqual(['images/s/c/a.bin']);
    expect(objectStorage.listObjectKeys).toHaveBeenCalledWith('images/s/c/');
  });

  it('throws NotFoundException when no objects are listed', async () => {
    objectStorage.listObjectKeys.mockResolvedValue([]);
    await expect(
      controller.list({ sessionId: 's', conversationId: 'c' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('streams an object with AWS content-type metadata', async () => {
    const stream = Readable.from(['data']);
    objectStorage.getObjectStreamAndMeta.mockResolvedValue({
      stream,
      meta: { ContentType: 'image/png' },
    });
    const res = {
      type: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      send: vi.fn((value) => value),
    };

    const result = await controller.getObject(
      { sessionId: 's', conversationId: 'c', hash: 'abc' },
      res as never,
    );

    expect(res.type).toHaveBeenCalledWith('image/png');
    expect(res.header).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600',
    );
    expect(res.send).toHaveBeenCalledWith(stream);
    expect(result).toBe(stream);
  });

  it('maps object download failures to NotFoundException', async () => {
    objectStorage.getObjectStreamAndMeta.mockRejectedValue(
      new Error('missing'),
    );
    await expect(
      controller.getObject(
        { sessionId: 's', conversationId: 'c', hash: 'abc' },
        {} as never,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('reports object existence', async () => {
    objectStorage.objectExists.mockResolvedValue(true);
    await expect(
      controller.exists({ sessionId: 's', conversationId: 'c', hash: 'abc' }),
    ).resolves.toEqual({ exists: true });
  });

  it('deletes one object', async () => {
    await controller.removeObject({
      sessionId: 's',
      conversationId: 'c',
      hash: 'abc',
    });
    expect(objectStorage.deleteObject).toHaveBeenCalledWith('s', 'c', 'abc');
  });

  it('deletes all objects under a prefix through the service', async () => {
    objectStorage.listObjectKeys.mockResolvedValue(['images/s/c/a.bin']);
    await controller.remove({ sessionId: 's', conversationId: 'c' });
    expect(objectStorage.deleteObjectKeys).toHaveBeenCalledWith([
      'images/s/c/a.bin',
    ]);
  });
});
