/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Primary brand: electric indigo ──────────────────────────────────
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // ── Duel: hot amber / orange ─────────────────────────────────────────
        duel: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // ── Practice/Problem Set: neon cyan ──────────────────────────────────
        practice: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        // ── Adaptive: electric violet ─────────────────────────────────────────
        adaptive: {
          50:  '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        },
        // ── Surface: void blacks ──────────────────────────────────────────────
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#131c2e',
          900: '#0d1117',
          925: '#0a0d14',
          950: '#07080a',
        },
        // ── Neon accents ──────────────────────────────────────────────────────
        neon: {
          cyan:    '#06b6d4',
          indigo:  '#6366f1',
          violet:  '#8b5cf6',
          amber:   '#f59e0b',
          emerald: '#10b981',
          rose:    '#f43f5e',
          pink:    '#ec4899',
        },
        // ── Semantic success ─────────────────────────────────────────────────
        success: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },

      fontFamily: {
        sans:    ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
        display: ['Cal Sans', 'Inter var', 'Inter', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },

      // ── Extended animations ───────────────────────────────────────────────
      animation: {
        'fade-in':          'fadeIn 0.25s ease-out',
        'fade-up':          'fadeUp 0.35s ease-out',
        'fade-down':        'fadeDown 0.3s ease-out',
        'slide-up':         'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down':       'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left':       'slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right':      'slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':         'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-out':        'scaleOut 0.2s ease-in',
        'pulse-soft':       'pulseSoft 3s ease-in-out infinite',
        'glow-pulse':       'glowPulse 2.5s ease-in-out infinite',
        'float':            'float 4s ease-in-out infinite',
        'shimmer':          'shimmer 2.5s linear infinite',
        'spin-slow':        'spin 8s linear infinite',
        'bounce-subtle':    'bounceSubtle 2s infinite',
        'gradient-shift':   'gradientShift 6s ease infinite',
        'beam':             'beam 3s linear infinite',
        'orbit':            'orbit 12s linear infinite',
      },

      keyframes: {
        fadeIn:        { '0%': { opacity: '0' },                               '100%': { opacity: '1' } },
        fadeUp:        { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeDown:      { '0%': { opacity: '0', transform: 'translateY(-12px)'},'100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp:       { '0%': { opacity: '0', transform: 'translateY(16px)' },'100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown:     { '0%': { opacity: '0', transform: 'translateY(-16px)'},'100%': { opacity: '1', transform: 'translateY(0)' } },
        slideLeft:     { '0%': { opacity: '0', transform: 'translateX(16px)' },'100%': { opacity: '1', transform: 'translateX(0)' } },
        slideRight:    { '0%': { opacity: '0', transform: 'translateX(-16px)'},'100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:       { '0%': { opacity: '0', transform: 'scale(0.93)' },     '100%': { opacity: '1', transform: 'scale(1)' } },
        scaleOut:      { '0%': { opacity: '1', transform: 'scale(1)' },        '100%': { opacity: '0', transform: 'scale(0.93)' } },
        pulseSoft:     { '0%, 100%': { opacity: '1' },                         '50%': { opacity: '0.6' } },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(99,102,241,0.25), 0 0 32px rgba(99,102,241,0.1)' },
          '50%':       { boxShadow: '0 0 32px rgba(99,102,241,0.5),  0 0 64px rgba(99,102,241,0.2)' },
        },
        float:  { '0%, 100%': { transform: 'translateY(0)' },        '50%': { transform: 'translateY(-8px)' } },
        bounceSubtle: { '0%, 100%': { transform: 'translateY(-4%)' },'50%': { transform: 'translateY(0)' } },
        shimmer: {
          '0%':   { backgroundPosition: '-1200px 0' },
          '100%': { backgroundPosition:  '1200px 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        beam: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        orbit: {
          '0%':   { transform: 'rotate(0deg)   translateX(60px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(60px) rotate(-360deg)' },
        },
      },

      // ── Box shadows ───────────────────────────────────────────────────────
      boxShadow: {
        'glass':           '0 8px 32px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glow-brand':      '0 0 24px rgba(99,102,241,0.4),  0 0 48px rgba(99,102,241,0.15)',
        'glow-duel':       '0 0 24px rgba(245,158,11,0.4),  0 0 48px rgba(245,158,11,0.15)',
        'glow-practice':   '0 0 24px rgba(6,182,212,0.4),   0 0 48px rgba(6,182,212,0.15)',
        'glow-adaptive':   '0 0 24px rgba(217,70,239,0.4),  0 0 48px rgba(217,70,239,0.15)',
        'glow-emerald':    '0 0 24px rgba(16,185,129,0.4),  0 0 48px rgba(16,185,129,0.15)',
        'inner-glow':      'inset 0 1px 0 rgba(255,255,255,0.08)',
        'elevated':        '0 4px 24px -4px rgba(0,0,0,0.5)',
        'premium':         '0 20px 60px -12px rgba(0,0,0,0.7)',
        'card-hover':      '0 8px 32px -4px rgba(99,102,241,0.25)',
        'sm-dark':         '0 1px 3px rgba(0,0,0,0.4)',
        'md-dark':         '0 4px 12px rgba(0,0,0,0.4)',
        'lg-dark':         '0 8px 24px rgba(0,0,0,0.5)',
      },

      // ── Background images ─────────────────────────────────────────────────
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'dot-pattern':       'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
        'grid-pattern':      'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'noise':             "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
        'hero-gradient':     'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(217,70,239,0.12) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 20% 70%, rgba(6,182,212,0.1) 0%, transparent 50%)',
        'sidebar-gradient':  'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 40%)',
      },

      backgroundSize: {
        'grid':  '32px 32px',
        'dot':   '20px 20px',
      },

      backdropBlur: {
        'xs':  '2px',
        '2xl': '40px',
        '3xl': '64px',
      },

      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },

      transitionTimingFunction: {
        'spring':   'cubic-bezier(0.16, 1, 0.3, 1)',
        'snappy':   'cubic-bezier(0.4, 0, 0.2, 1)',
        'overshoot':'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
