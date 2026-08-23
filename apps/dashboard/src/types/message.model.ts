import type { MessageData } from './message-data.model';

export interface Message {
  time: string;
  event: string;
  data: MessageData;
}
