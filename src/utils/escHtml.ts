// HTML escaping helper. Server pages render Hono HTML strings, and the
// client-side scripts use template literals + innerHTML to paint DB-sourced
// fields like company names and ticket notes. Without escaping, anyone who
// can write a value into the DB (a customer typing a notes field, an admin
// editing a void reason) can land stored XSS in every viewer's browser.
//
// This file exports a `<script>` snippet to inject into <head> via the layout
// wrappers, so every page has window.escHtml + window.escAttr available
// without each page having to redefine them.

export const ESC_HTML_SCRIPT = `
<script>
  // Escape characters that are unsafe inside HTML text/element context.
  window.escHtml = function(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  // Escape for use inside a double-quoted HTML attribute. Same as escHtml
  // but exposed as a separate name to make intent obvious at call sites.
  window.escAttr = window.escHtml;
</script>
`
