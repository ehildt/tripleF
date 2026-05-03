import type { Socket } from 'socket.io-client';

export type ToastApi = {
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
};

export function handleResponse(
  res: Response,
  socket: Socket | null | undefined,
  toast: ToastApi,
): void {
  if (!res.ok) res.text().then((text) => toast.error(`${res.status}: ${text}`));
  else if (socket?.connected) toast.info('Request sent successfully');
  else toast.warning('Request sent but socket disconnected');
}
