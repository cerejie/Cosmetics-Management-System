/**
 * Prints a standalone HTML document from a hidden iframe.
 *
 * `window.print()` would print the whole application — sidebar, filters and
 * all — and taming that with `@media print` rules means the app's stylesheet
 * has to know about every screen that can print. An iframe carries its own
 * document and its own stylesheet, so the printed page is exactly what the
 * caller built and nothing else.
 */
export const printDocument = (title: string, bodyHtml: string, css: string): void => {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';

  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  const win = frame.contentWindow;

  if (!doc || !win) {
    frame.remove();
    return;
  }

  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
      `<style>${css}</style></head><body>${bodyHtml}</body></html>`,
  );
  doc.close();

  // The print dialog is modal, so the frame cannot be removed until it closes.
  // Firefox fires afterprint on the frame's window; Chrome returns from print().
  const cleanUp = (): void => frame.remove();
  win.addEventListener('afterprint', cleanUp, { once: true });

  win.focus();
  win.print();

  // Chrome has already returned by here; the listener covers the browsers that
  // have not. A late second call to remove() on a detached node is harmless.
  window.setTimeout(cleanUp, 1000);
};

/** Escapes text before it is interpolated into printed markup. */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
