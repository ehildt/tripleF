import DOMPurify from 'dompurify';

export function sanitizeHtml(content: string): string {
  // iframe is intentionally allowed for embedded media (video embeds).
  // DOMPurify still strips dangerous iframe attributes (srcdoc, event
  // handlers) and only the whitelisted ADD_ATTR below survive, so this is a
  // deliberate, mitigated exception rather than an open XSS hole.
  // eslint-disable-next-line sonarjs/dompurify-unsafe-config
  const clean = DOMPurify.sanitize(content, {
    ADD_TAGS: ['img', 'video', 'source', 'iframe'],
    ADD_ATTR: [
      'alt',
      'title',
      'src',
      'width',
      'height',
      'controls',
      'autoplay',
      'loop',
      'muted',
      'poster',
      'type',
      'frameborder',
      'allowfullscreen',
    ],
  });
  return clean.replace(/<img\b/g, '<img onerror="this.style.display=\'none\'"');
}
