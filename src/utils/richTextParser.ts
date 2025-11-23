/**
 * Simple Rich Text Parser
 *
 * Converts simple text formatting to HTML:
 * - *text* → <em>italic</em>
 * - 「dialogue」 → <span class="dialogue">dialogue</span>
 * - Line breaks → <br>
 *
 * No complex nested structures or placeholders needed.
 */

/**
 * Parse rich text and convert to HTML
 */
export function parseRichText(text: string): string {
  if (!text) return '';

  let result = text;

  // 1. Convert *text* to <em>italic</em>
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 2. Convert「dialogue」to styled span
  result = result.replace(/「([^」]+)」/g, '<span class="dialogue">「$1」</span>');

  // 3. Convert line breaks
  result = result.replace(/\n/g, '<br>');

  return result;
}

/**
 * Strip all rich text formatting (for plain text display)
 */
export function stripRichText(text: string): string {
  if (!text) return '';

  let result = text;

  // Remove all HTML tags
  result = result.replace(/<[^>]*>/g, '');

  // Remove formatting markers
  result = result.replace(/\*/g, '');

  return result;
}
