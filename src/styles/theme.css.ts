import { createGlobalTheme } from '@vanilla-extract/css';

/**
 * Design tokens. These mirror the antd theme in styles/antdTheme.ts so custom
 * vanilla-extract styles and antd components stay visually in sync.
 */
export const vars = createGlobalTheme(':root', {
  color: {
    primary: '#c2185b',
    primaryHover: '#ad1457',
    primarySoft: '#fce4ec',
    text: '#1f1f1f',
    textMuted: '#6b6b6b',
    border: '#ebe4e7',
    surface: '#ffffff',
    canvas: '#faf7f8',
    success: '#2e7d32',
    warning: '#ed6c02',
    danger: '#c62828',
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
  },
  font: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sizeSm: '12px',
    sizeMd: '14px',
    sizeLg: '18px',
    sizeXl: '24px',
  },
  shadow: {
    sm: '0 1px 2px rgba(31, 31, 31, 0.06)',
    md: '0 4px 16px rgba(31, 31, 31, 0.08)',
  },
});
