function tryParseJsonPrompt(text: string): string | undefined {
  try {
    const payload = JSON.parse(text);
    const prompt = payload?.params?.arguments?.prompt;
    if (prompt) return JSON.stringify(prompt);
  } catch {
    /* ignore */
  }
  return undefined;
}

export function extractPrompt(
  formData?: FormData,
  body?: string,
): string | undefined {
  if (formData) {
    const promptValue = formData.get('prompt');
    if (promptValue && typeof promptValue === 'string') return promptValue;

    const payloadValue = formData.get('payload');
    if (payloadValue && typeof payloadValue === 'string') {
      const result = tryParseJsonPrompt(payloadValue);
      if (result) return result;
    }
  }

  if (body) {
    return tryParseJsonPrompt(body);
  }

  return undefined;
}
