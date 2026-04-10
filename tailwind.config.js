/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Map design-system CSS tokens to Tailwind utilities
        'bg-primary':    'var(--bg-primary)',
        'bg-secondary':  'var(--bg-secondary)',
        'bg-tertiary':   'var(--bg-tertiary)',
        'text-primary':  'var(--text-primary)',
        'text-secondary':'var(--text-secondary)',
        'text-muted':    'var(--text-muted)',
        border:          'var(--border)',
        'border-light':  'var(--border-light)',
        accent:          'var(--accent)',
        'accent-dim':    'var(--accent-dim)',
        danger:          'var(--danger)',
        'danger-dim':    'var(--danger-dim)',
        success:         'var(--success)',
        warning:         'var(--warning)',
        overlay:         'var(--overlay)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', "'SF Pro Text'", "'Segoe UI'", 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'heading':  ['18px', { fontWeight: '600' }],
        'body':     ['16px', { fontWeight: '500' }],
        'label':    ['12px', { fontWeight: '500' }],
        'status':   ['13px', { fontWeight: '500' }],
      },
      minWidth:  { touch: '44px' },
      minHeight: { touch: '44px' },
      transitionTimingFunction: {
        'ios-spring': 'cubic-bezier(0.32,0.72,0,1)',
      },
      transitionDuration: {
        '280': '280ms',
      },
    },
  },
  plugins: [],
};
