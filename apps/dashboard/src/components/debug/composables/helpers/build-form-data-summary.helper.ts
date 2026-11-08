export function buildFormDataSummary(formData: FormData): string {
  const parts: string[] = [];
  const images: File[] = [];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      images.push(value);
    } else if (key !== 'prompt') {
      parts.push(`${key}: ${String(value)}`);
    }
  }

  if (images.length) {
    const imageParts = images.map((f) => {
      const size =
        f.size > 1024 ? `${(f.size / 1024).toFixed(1)} KB` : `${f.size} B`;
      return `${f.name} (${size})`;
    });
    parts.push(
      `${images.length} file${images.length > 1 ? 's' : ''}: ${imageParts.join(', ')}`,
    );
  }

  const prompt = formData.get('prompt');
  if (prompt && typeof prompt === 'string') {
    const preview = prompt.length > 200 ? prompt.slice(0, 200) + '...' : prompt;
    parts.push(`prompt: ${preview}`);
  }

  return parts.join('\n');
}
