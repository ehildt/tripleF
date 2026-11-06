import {
  ObjectStorageConfigAdapter,
  ObjectStorageConfigSchema,
} from './object-storage-config.adapter.js';

const validEnv = {
  OBJECT_STORAGE_ENDPOINT: 'http://localhost:9000',
  OBJECT_STORAGE_ACCESS_KEY_ID: 'test-access',
  OBJECT_STORAGE_SECRET_ACCESS_KEY: 'test-secret',
  OBJECT_STORAGE_BUCKET: 'test-bucket',
} as NodeJS.ProcessEnv;

function parseConfig(env: NodeJS.ProcessEnv) {
  return ObjectStorageConfigSchema.parse(ObjectStorageConfigAdapter(env));
}

describe('ObjectStorageConfigAdapter', () => {
  it('accepts a valid object-storage configuration', () => {
    const config = ObjectStorageConfigAdapter(validEnv);
    expect(config).toEqual({
      endpoint: 'http://localhost:9000',
      accessKeyId: 'test-access',
      secretAccessKey: 'test-secret',
      bucket: 'test-bucket',
      region: 'us-east-1',
      imageTtlDays: 7,
    });
  });

  it.each([
    'OBJECT_STORAGE_ENDPOINT',
    'OBJECT_STORAGE_ACCESS_KEY_ID',
    'OBJECT_STORAGE_SECRET_ACCESS_KEY',
  ])('throws when %s is missing', (key) => {
    const env = { ...validEnv };
    delete env[key];
    expect(() => parseConfig(env)).toThrow();
  });

  it('applies bucket, region, and image TTL defaults', () => {
    const env = { ...validEnv };
    delete env.OBJECT_STORAGE_BUCKET;
    const config = ObjectStorageConfigAdapter(env);
    expect(config.bucket).toBe('failed-jobs');
    expect(config.region).toBe('us-east-1');
    expect(config.imageTtlDays).toBe(7);
  });

  it('rejects an endpoint without a URL scheme', () => {
    expect(() =>
      parseConfig({
        ...validEnv,
        OBJECT_STORAGE_ENDPOINT: 'localhost:9000',
      }),
    ).toThrow();
  });

  it.each([0, 1.5])('rejects invalid image TTL %s', (days) => {
    expect(() =>
      parseConfig({
        ...validEnv,
        OBJECT_STORAGE_IMAGE_TTL_DAYS: String(days),
      }),
    ).toThrow();
  });

  it('reads an explicit region and image TTL', () => {
    const config = ObjectStorageConfigAdapter({
      ...validEnv,
      OBJECT_STORAGE_REGION: 'eu-central-1',
      OBJECT_STORAGE_IMAGE_TTL_DAYS: '14',
    });
    expect(config.region).toBe('eu-central-1');
    expect(config.imageTtlDays).toBe(14);
  });
});
