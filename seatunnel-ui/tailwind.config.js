/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#3B82F6',
          'blue-hover': '#2563EB',
          'blue-pressed': '#1D4ED8'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#121212',
          elevated: '#1E1E1E',
          deep: '#000000'
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
          'primary-dark': '#F8FAFC',
          'secondary-dark': '#94A3B8',
          'muted-dark': '#64748B'
        },
        success: {
          DEFAULT: '#16A34A',
          dark: '#22C55E'
        },
        warning: {
          DEFAULT: '#D97706'
        },
        danger: {
          DEFAULT: '#DC2626',
          dark: '#EF4444'
        },
        source: {
          DEFAULT: '#22C55E',
          dark: '#34D399'
        },
        sink: {
          DEFAULT: '#2563EB',
          dark: '#60A5FA'
        },
        process: {
          DEFAULT: '#8B5CF6',
          dark: '#A78BFA'
        },
        /* CSS variable-based semantic colors */
        card: 'var(--color-card)',
        border: 'var(--color-border)',
        foreground: 'var(--color-foreground)',
        'muted-foreground': 'var(--color-muted-foreground)',
        'card-foreground': 'var(--color-card-foreground)',
        primary: 'var(--color-primary)',
      },
      fontFamily: {
        sans: ['Fira Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'Cascadia Code', 'JetBrains Mono', 'monospace']
      },
      fontSize: {
        tiny: ['11px', '16px'],
        xs: ['12px', '18px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '26px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px']
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },
      borderRadius: {
        DEFAULT: '4px',
        none: '0',
        sm: '2px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
        card: 'var(--radius-card)',
      },
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        modern: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)'
      },
      spacing: {
        '0': '0',
        'px': '1px',
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px'
      },
      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms'
      },
      height: {
        'nav-item': '40px',
        'btn': '40px',
        'btn-sm': '32px',
        'input': '40px',
        'input-sm': '32px',
        'table-header': '40px',
        'table-row': '40px'
      },
      minHeight: {
        'touch': '44px'
      },
      minWidth: {
        'touch': '44px'
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: []
}
