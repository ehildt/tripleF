import type { SerializedBuffer } from './is-buffer-or-serialized.helper.types.ts';

/**
 * Checks if an object matches the SerializedBuffer format.
 * Must have type: "Buffer" and data: number[]
 */
export function isSerializedBuffer(obj: object): obj is SerializedBuffer {
  const record = obj as Record<string, unknown>;
  return record.type === 'Buffer' && Array.isArray(record.data);
}
