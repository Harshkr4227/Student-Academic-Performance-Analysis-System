export function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateToggleLabels(saved);

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateToggleLabels(next);
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
    });
  });
}

function updateToggleLabels(theme) {
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
  });
}

export function getChartThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    accent: styles.getPropertyValue('--color-accent').trim() || '#94A3B8',
    secondary: '#334155',
    text: styles.getPropertyValue('--color-text').trim() || '#1E293B',
    border: styles.getPropertyValue('--color-border').trim() || '#E2E8F0'
  };
}
