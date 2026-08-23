import { BinaryToTextEncoding, createHash } from 'crypto';

import { hashPayload, HashPayloadSupportedAlgorithm } from './hash-payload.helper.ts';

describe('hashPayload', () => {
  const algorithms: HashPayloadSupportedAlgorithm[] = ['sha256', 'sha384', 'sha512'];
  const encodings: BinaryToTextEncoding[] = ['hex', 'base64', 'base64url', 'binary'];

  it('should produce consistent hash for same string input', () => {
    const input = 'hello world';
    const hash1 = hashPayload(input);
    const hash2 = hashPayload(input);
    expect(hash1).toBe(hash2);
  });

  it('should produce consistent hash for same object input', () => {
    const obj = { foo: 'bar', count: 42 };
    const hash1 = hashPayload(obj);
    const hash2 = hashPayload(obj);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different inputs', () => {
    const a = 'hello';
    const b = 'world';
    expect(hashPayload(a)).not.toBe(hashPayload(b));
  });

  it("should match Node's createHash output for all algorithms and encodings", () => {
    const input = { x: 123 };
    algorithms.forEach((algo) => {
      encodings.forEach((enc) => {
        const expected = createHash(algo).update(JSON.stringify(input)).digest(enc);
        expect(hashPayload(input, algo, enc)).toBe(expected);
      });
    });
  });

  it('should handle string input with specified algorithm and encoding', () => {
    const input = 'test string';
    algorithms.forEach((algo) => {
      encodings.forEach((enc) => {
        const expected = createHash(algo).update(input).digest(enc);
        expect(hashPayload(input, algo, enc)).toBe(expected);
      });
    });
  });

  it('should produce different outputs for different encodings', () => {
    const input = 'encode me';
    const hashes = encodings.map((enc) => hashPayload(input, 'sha256', enc));
    const uniqueHashes = new Set(hashes);
    expect(uniqueHashes.size).toBe(hashes.length);
  });

  it('should handle Buffer input', () => {
    const buffer = Buffer.from('test buffer');
    const expected = createHash('sha256').update(buffer).digest('hex');
    expect(hashPayload(buffer, 'sha256', 'hex')).toBe(expected);
  });

  it('should handle Uint8Array input', () => {
    const uint8 = new TextEncoder().encode('test uint8array');
    const expected = createHash('sha256').update(uint8).digest('hex');
    expect(hashPayload(uint8, 'sha256', 'hex')).toBe(expected);
  });
});
