import { z } from 'zod';

export const commonDebugSchema = z.object({
  sockets: z.string().optional(),
  clearLog: z.string().optional(),
  clickAgainClearLog: z.string().optional(),
  pauseLogging: z.string().optional(),
  resumeLogging: z.string().optional(),
  showReadRequests: z.string().optional(),
  hideReadRequests: z.string().optional(),
  unsubscribeFrom: z.string().optional(),
  subscribe: z.string(),
  channel: z.string().optional(),
  event: z.string().optional(),
  roomId: z.string().optional(),
  socket: z.string().optional(),
  noMatchingRequests: z.string().optional(),
  noRequestsYet: z.string().optional(),
  noUnreadRequests: z.string().optional(),
  sendRequestToSeeResults: z.string().optional(),
  requestDetails: z.string().optional(),
  requestLog: z.string().optional(),
  body: z.string().optional(),
  headers: z.string().optional(),
  params: z.string().optional(),
  response: z.string().optional(),
  sessionIdClickToCopy: z.string(),
  noSession: z.string(),
});

export type CommonDebugMessages = z.infer<typeof commonDebugSchema>;
