import type { MemoryScopeFilters } from '../models/memory.model.js';

type MemoryFilterInput = MemoryScopeFilters;

/**
 * The complete `must` clause set for any memory read: the space key plus
 * every optional tightening filter (session / role / conversation / request /
 * tags / full-text containment / exact text). A point's space is its identity
 * field — `memory_partition` for the user's fact space, `memory_cognition`
 * for the AI's understanding-of-the-user space; one is set, never both.
 * Shared by the search, list, and delete paths so the surfaces never drift.
 */
export function buildMemoryMust(
  input: MemoryFilterInput,
): Array<Record<string, unknown>> {
  const must: Array<Record<string, unknown>> = [];
  if (input.memoryPartition) {
    must.push({
      key: 'memory_partition',
      match: { value: input.memoryPartition },
    });
  }
  if (input.memoryCognition) {
    must.push({
      key: 'memory_cognition',
      match: { value: input.memoryCognition },
    });
  }
  if (input.sessionId) {
    must.push({ key: 'session_id', match: { value: input.sessionId } });
  }
  if (input.role) {
    must.push({ key: 'role', match: { value: input.role } });
  }
  if (input.conversationId) {
    must.push({
      key: 'conversation_id',
      match: { value: input.conversationId },
    });
  }
  if (input.requestId) {
    must.push({ key: 'request_id', match: { value: input.requestId } });
  }
  if (input.tags?.length) {
    must.push({ key: 'tags', match: { any: input.tags } });
  }
  if (input.contains) {
    must.push({ key: 'text', match: { text: input.contains } });
  }
  if (input.text) {
    must.push({ key: 'text', match: { value: input.text } });
  }
  return must;
}
