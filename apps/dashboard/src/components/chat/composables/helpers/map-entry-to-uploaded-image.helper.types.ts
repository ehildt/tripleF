import type { AssistantResponseMetadata } from '@/types/assistant-socket-event.model';

/** Response metadata after validation of the fields required for uploads. */
export type UploadedResponseImageEntry = Required<
  Pick<AssistantResponseMetadata, 'name' | 'hash'>
> &
  Omit<AssistantResponseMetadata, 'name' | 'hash'>;
