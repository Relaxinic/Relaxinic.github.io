(() => {
  const storageKey = 'relaxinic-theme';
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const scheme = document.querySelector('meta[name="color-scheme"]');

  function readMode() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // The picker still works for this page when storage is unavailable.
    }
    return 'system';
  }

  let mode = readMode();

  function applyTheme() {
    const resolved = mode === 'system' ? (systemDark.matches ? 'dark' : 'light') : mode;
    root.dataset.theme = resolved;
    root.dataset.themeMode = mode;
    if (scheme) scheme.content = resolved;
    if (meta) meta.content = resolved === 'dark' ? '#000000' : '#f8f8f6';

    for (const option of document.querySelectorAll('[data-theme-choice]')) {
      option.checked = option.value === mode;
    }
  }

  function syncSavedMode() {
    mode = readMode();
    applyTheme();
  }

  document.addEventListener('change', (event) => {
    if (!event.target.matches('[data-theme-choice]')) return;
    mode = event.target.value;
    try {
      localStorage.setItem(storageKey, mode);
    } catch {
      // Apply the choice even if the browser blocks storing it.
    }
    applyTheme();
  });

  systemDark.addEventListener('change', applyTheme);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) syncSavedMode();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey || event.key === null) syncSavedMode();
  });

  applyTheme();
})();
