import DOMPurify from 'dompurify';

export function sanitizeHtml(content: string): string {
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
