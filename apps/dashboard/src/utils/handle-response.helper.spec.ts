import type { Socket } from 'socket.io-client';
import { describe, expect, it, vi } from 'vitest';

import { i18n } from '@/i18n/i18n';

import { handleResponse, type ToastApi } from './handle-response.helper';

function mockResponse(ok: boolean, status: number, bodyText = ''): Response {
  return {
    ok,
    status,
    text: vi.fn().mockResolvedValue(bodyText),
  } as unknown as Response;
}

function mockSocket(connected: boolean) {
  return { connected } as unknown as Socket;
}

function mockToast(): ToastApi {
  return {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  };
}

describe('handleResponse', () => {
  it('shows error when response is not ok', async () => {
    const toast = mockToast();
    handleResponse(mockResponse(false, 500, 'fail'), mockSocket(true), toast);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toast.error).toHaveBeenCalledWith(
      i18n.global.t('toast.requestError', { status: 500, detail: 'fail' }),
    );
  });

  it('shows success when response is ok and socket connected', () => {
    const toast = mockToast();
    handleResponse(mockResponse(true, 200), mockSocket(true), toast);
    expect(toast.success).toHaveBeenCalledWith(
      i18n.global.t('toast.requestSent'),
    );
  });

  it('shows warning when response is ok and socket disconnected', () => {
    const toast = mockToast();
    handleResponse(mockResponse(true, 200), mockSocket(false), toast);
    expect(toast.warning).toHaveBeenCalledWith(
      i18n.global.t('toast.requestSentSocketDisconnected'),
    );
  });
});
