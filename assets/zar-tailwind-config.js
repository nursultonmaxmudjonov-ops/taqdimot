/*
 * ZAR — shared Tailwind config, loaded on every page right after the
 * Tailwind CDN script. Every color points at the CSS custom properties
 * defined in zar-app.css, so Tailwind utility classes (bg-panel, text-gold)
 * and hand-written CSS (var(--panel)) always resolve to the same value.
 */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        bg: { DEFAULT: 'var(--bg-deep)', deep: 'var(--bg-deep)', mid: 'var(--bg-mid)', sidebar: 'var(--bg-sidebar)' },
        sidebar: 'var(--bg-sidebar)',
        panel: { DEFAULT: 'var(--panel)', 2: 'var(--panel-2)' },
        card: 'var(--panel)',
        line: 'var(--line)',
        border: 'var(--line)',
        gold: { DEFAULT: 'var(--gold-2)', 1: 'var(--gold-1)', 2: 'var(--gold-2)', 3: 'var(--gold-3)', light: 'var(--gold-1)', dim: 'var(--gold-3)' },
        golddim: 'var(--gold-3)',
        txt: { DEFAULT: 'var(--text)', dim: 'var(--text-dim)', faint: 'var(--text-faint)' },
        text: { DEFAULT: 'var(--text)', dim: 'var(--text-dim)' },
        txtdim: 'var(--text-dim)',
        txtfaint: 'var(--text-faint)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        teal: { DEFAULT: 'var(--teal)', 1: 'var(--teal-1)', 2: 'var(--teal-2)' }
      }
    }
  }
};
