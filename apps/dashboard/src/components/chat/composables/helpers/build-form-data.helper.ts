import type { FormExtras } from './build-form-data.helper.types';

export function buildFormData(files: File[], extras?: FormExtras): FormData {
  const formData = new FormData();
  for (const file of files) formData.append('attachments', file, file.name);
  if (extras?.originals) {
    for (const file of extras.originals) {
      formData.append('originals', file, file.name);
    }
  }
  if (extras?.prompt) formData.append('prompt', extras.prompt);
  if (extras?.documentTextLimit) {
    formData.append('documentTextLimit', String(extras.documentTextLimit));
  }
  return formData;
}
