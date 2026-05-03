import type { Socket } from 'socket.io-client';
import { describe, expect, it, vi } from 'vitest';

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
    info: vi.fn(),
    warning: vi.fn(),
  };
}

describe('handleResponse', () => {
  it('shows error when response is not ok', async () => {
    const toast = mockToast();
    handleResponse(mockResponse(false, 500, 'fail'), mockSocket(true), toast);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toast.error).toHaveBeenCalledWith('500: fail');
  });

  it('shows info when response is ok and socket connected', () => {
    const toast = mockToast();
    handleResponse(mockResponse(true, 200), mockSocket(true), toast);
    expect(toast.info).toHaveBeenCalledWith('Request sent successfully');
  });

  it('shows warning when response is ok and socket disconnected', () => {
    const toast = mockToast();
    handleResponse(mockResponse(true, 200), mockSocket(false), toast);
    expect(toast.warning).toHaveBeenCalledWith(
      'Request sent but socket disconnected',
    );
  });
});
