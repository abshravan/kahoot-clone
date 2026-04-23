/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1200px' },
    },
    extend: {
      colors: {
        // shadcn-compatible tokens (driven by CSS vars in globals.css)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        // Knowledge Stack palette (direct hex, Material 3-inspired)
        primary: {
          DEFAULT: '#0040df',
          foreground: '#ffffff',
          dark: '#0035bd',
          container: '#2d5bff',
          fixed: '#dde1ff',
          'fixed-dim': '#b8c3ff',
        },
        secondary: {
          DEFAULT: '#ad0089',
          foreground: '#ffffff',
          dark: '#87006b',
          container: '#d800ac',
          fixed: '#ffd8ec',
          'fixed-dim': '#ffaede',
        },
        tertiary: {
          DEFAULT: '#705d00',
          foreground: '#ffffff',
          dark: '#544600',
          container: '#c9a900',
          fixed: '#ffe16d',
          'fixed-dim': '#e9c400',
        },
        surface: {
          DEFAULT: '#fcf8ff',
          dim: '#dad7f3',
          bright: '#fcf8ff',
          'container-lowest': '#ffffff',
          'container-low': '#f5f2ff',
          container: '#efecff',
          'container-high': '#e8e5ff',
          'container-highest': '#e2e0fc',
          variant: '#e2e0fc',
        },
        'on-surface': {
          DEFAULT: '#1a1a2e',
          variant: '#434656',
        },
        outline: {
          DEFAULT: '#747688',
          variant: '#c4c5d9',
        },

        // Answer tile colors (from the design)
        answer: {
          red: '#FF3355',
          'red-dark': '#CC2944',
          blue: '#0040df',
          'blue-dark': '#0033B3',
          yellow: '#FFC000',
          'yellow-dark': '#CC9900',
          green: '#11CC66',
          'green-dark': '#0DA352',
        },
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        label: ['"Spline Sans"', 'sans-serif'],
      },
      fontSize: {
        'display-xl': [
          '48px',
          { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '800' },
        ],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '500' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'label-bold': ['14px', { lineHeight: '20px', fontWeight: '700' }],
      },
      backgroundImage: {
        'pattern-dots':
          'radial-gradient(#2d5bff1a 1.5px, transparent 1.5px), radial-gradient(#2d5bff1a 1.5px, #fcf8ff 1.5px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
