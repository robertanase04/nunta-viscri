/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        'ink-deep': 'var(--ink-deep)',
        'ink-soft': 'var(--ink-soft)',
        paper: 'var(--paper)',
        'paper-warm': 'var(--paper-warm)',
        'paper-deep': 'var(--paper-deep)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        caps: 'var(--font-caps)',
      },
    },
  },
  plugins: [],
}
