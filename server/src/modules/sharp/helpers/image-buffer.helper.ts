import {
  isNodeBuffer,
  isSerializedBuffer,
  SerializedBuffer,
} from '@ehildt/ckir-helpers/is-buffer-or-serialized';

/**
 * Convert serialized Buffer objects back to real Buffer instances.
 * BullMQ serializes Buffers to { type: 'Buffer', data: [...] } when storing in Redis.
 */
export function toBuffer(input: Buffer | SerializedBuffer): Buffer {
  if (isNodeBuffer(input)) return input;
  if (isSerializedBuffer(input)) return Buffer.from(input.data);
  throw new Error('Invalid buffer format');
}
