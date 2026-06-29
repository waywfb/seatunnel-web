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
        }
      },
      fontFamily: {
        sans: ['Fira Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'Cascadia Code', 'JetBrains Mono', 'monospace']
      },
      borderRadius: {
        DEFAULT: '4px'
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: []
}