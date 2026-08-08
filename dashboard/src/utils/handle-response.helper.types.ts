export type ToastApi = {
  error: (message: string) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
};
