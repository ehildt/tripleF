export type ToastApi = {
  error: (message: string) => void;
};

export function requireModel(
  model: { value: string },
  toast: ToastApi,
): boolean {
  if (!model.value.trim()) {
    toast.error('Model is required (e.g., llama3.2-vision, ministral-3:14b)');
    return false;
  }
  return true;
}
