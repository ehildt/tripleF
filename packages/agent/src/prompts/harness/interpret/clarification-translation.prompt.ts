/**
 * The interpret step asks its clarifying question in the model's own wording;
 * when the user's language is known, this mini-prompt re-renders the question
 * in that language before it reaches the client. Two builders: the system
 * contract and the user payload.
 */
export function buildClarificationTranslationSystemPrompt(language?: string): string {
  const code = language?.trim().toLowerCase() ?? '';

  // The model picks the language: either the detected ISO code or, when
  // detection failed, whatever language the latest user message is in.
  const targetRule =
    code.length === 2
      ? `Write ONLY in "${code}".`
      : 'Write in the SAME language as the quoted user message. Never use English unless the user message is English.';

  return `You translate short clarifying questions for a chat assistant. ${targetRule} Keep the question concise, natural, and faithful to the original meaning. Output ONLY the question.`;
}

export function buildClarificationTranslationUserPrompt(question: string, latestUserMessage?: string): string {
  return latestUserMessage
    ? `User message: ${latestUserMessage}\n\nQuestion to translate: ${question}`
    : `Question to translate: ${question}`;
}
