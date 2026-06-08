/**
 * Sanitize user-generated text to prevent XSS injection.
 * Strips HTML tags and dangerous characters.
 */
export function sanitize(str, maxLen = 2048) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')        // strip HTML tags
    .slice(0, maxLen);
}

/**
 * Sanitize a URL — only allow http/https/mailto protocols
 */
export function sanitizeURL(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed === '') return '';
  // Block javascript:, data:, vbscript: etc.
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
  return trimmed;
}

/**
 * Escape HTML special characters to prevent HTML/XSS injection.
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
