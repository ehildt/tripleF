import type { Socket } from 'socket.io-client';

import { i18n } from '@/i18n/i18n';

import type { ToastApi } from './handle-response.helper.types';

export function handleResponse(
  res: Response,
  socket: Socket | null | undefined,
  toast: ToastApi,
): void {
  if (!res.ok)
    res.text().then((text) =>
      toast.error(
        i18n.global.t('toast.requestError', {
          status: res.status,
          detail: text,
        }),
      ),
    );
  else if (socket?.connected) toast.success(i18n.global.t('toast.requestSent'));
  else toast.warning(i18n.global.t('toast.requestSentSocketDisconnected'));
}
