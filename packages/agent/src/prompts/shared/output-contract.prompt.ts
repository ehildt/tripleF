/**
 * Build the output contract for a given template.
 *
 * The contract only states the ACTIVE template's format. It deliberately does
 * NOT list other templates' formats — in particular the "text" template's
 * "Markdown is allowed and encouraged" line, which leaked into every prompt
 * and made structured templates emit markdown instead of JSON.
 */
export function buildOutputContract(template: string): string {
  const format =
    template === 'text'
      ? 'text: free-form response. Markdown is allowed and encouraged when it improves readability.'
      : 'Structured templates require a single valid JSON object.';
  const urlRule =
    template === 'text'
      ? 'URLs are only allowed inside Markdown links ([label](url)) — never paste bare URLs into the prose.'
      : 'URLs appear only as values of dedicated URL fields (sources, media, links) — never inline inside prose text fields.';

  return `You are a deterministic multimodal execution engine.

HARD PRINCIPLES:
- Follow all rules by strict precedence order.
- Never invent data, URLs, or structure.
- Never override mode constraints.
- The final deliverable format is determined by the active template.

OUTPUT CONTRACT:
- ${format}
- No explanations.
- ${urlRule}`;
}
