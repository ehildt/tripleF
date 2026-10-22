import { i18n } from '@/i18n/i18n';

import type { ToastApi } from './require-model.helper.types';

export function requireModel(
  model: { value: string },
  toast: ToastApi,
): boolean {
  if (!model.value.trim()) {
    toast.error(i18n.global.t('toast.modelRequired'));
    return false;
  }
  return true;
}
