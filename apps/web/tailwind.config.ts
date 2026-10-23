import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const tone = (name: string) => ({ 300: v(name), 400: v(name), 500: v(name), 600: v(name) });

/**
 * Semantic colors read CSS variables, so every utility works in light and dark mode.
 * Legacy palette names (slate, white, indigo, emerald...) are remapped to the same tokens,
 * which keeps older screens consistent with the new design without rewriting each class.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas: v('canvas'), surface: v('surface'), subtle: v('subtle'),
        ink: v('ink'), ink2: v('ink2'), muted: v('muted'), faint: v('faint'), line: v('line'),
        brand: v('brand'), 'on-brand': v('on-brand'), hi: v('hi'),
        good: v('good'), warn: v('warn'), bad: v('bad'),
        white: v('w'), black: v('b'),
        slate: { 50: v('canvas'), 100: v('ink'), 200: v('ink'), 300: v('ink2'), 400: v('muted'), 500: v('faint'), 600: v('line'), 700: v('line'), 800: v('subtle'), 900: v('canvas'), 950: v('canvas') },
        indigo: tone('brand'), violet: tone('brand'), fuchsia: tone('brand'), purple: tone('brand'),
        sky: tone('brand'), cyan: tone('brand'), teal: tone('brand'), blue: tone('brand'), pink: tone('bad'),
        emerald: tone('good'), green: tone('good'), lime: tone('good'),
        amber: tone('warn'), yellow: tone('warn'), orange: tone('warn'),
        rose: tone('bad'), red: tone('bad'),
      },
      fontWeight: { bold: '600' },
    },
  },
  plugins: [],
};
export default config;
