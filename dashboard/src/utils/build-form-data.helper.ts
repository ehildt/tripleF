export interface FormExtras {
  prompt?: string;
}

export function buildFormData(files: File[], extras?: FormExtras): FormData {
  const formData = new FormData();
  for (const file of files) formData.append('images', file, file.name);
  if (extras?.prompt) formData.append('prompt', extras.prompt);
  return formData;
}
