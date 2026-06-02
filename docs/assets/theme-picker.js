/* Lightweight CSS-only theme picker: sets data-theme / data-mode on html.
   Uses Vanilla Breeze's bundled core themes — no VB JS required. */
(function () {
  const root = document.documentElement;
  const KEY_T = 'vbds:theme', KEY_M = 'vbds:mode';
  const savedT = localStorage.getItem(KEY_T);
  const savedM = localStorage.getItem(KEY_M);
  if (savedT) root.setAttribute('data-theme', savedT);
  if (savedM) root.setAttribute('data-mode', savedM);

  const sel = document.querySelector('[data-theme-select]');
  if (sel) {
    sel.value = root.getAttribute('data-theme') || sel.value;
    sel.addEventListener('change', () => {
      root.setAttribute('data-theme', sel.value);
      localStorage.setItem(KEY_T, sel.value);
    });
  }
  const btn = document.querySelector('[data-mode-toggle]');
  const sync = () => {
    const dark = root.getAttribute('data-mode') === 'dark';
    if (btn) { btn.setAttribute('aria-pressed', String(dark)); btn.textContent = dark ? '☀️ Light' : '🌙 Dark'; }
  };
  if (btn) {
    btn.addEventListener('click', () => {
      const dark = root.getAttribute('data-mode') === 'dark';
      const next = dark ? 'light' : 'dark';
      root.setAttribute('data-mode', next);
      localStorage.setItem(KEY_M, next);
      sync();
    });
    sync();
  }
})();
