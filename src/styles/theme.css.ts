import { createGlobalTheme } from '@vanilla-extract/css';

/**
 * Design tokens. These mirror the antd theme in styles/antdTheme.ts so custom
 * vanilla-extract styles and antd components stay visually in sync.
 *
 * Spacing follows an 8-point scale. Neutrals are slate; the brand pink is
 * reserved for primary actions, selection and the revenue chart.
 */
export const vars = createGlobalTheme(':root', {
  color: {
    primary: '#c2185b',
    primaryHover: '#ad1457',
    primaryActive: '#961345',
    primarySoft: '#fdf2f7',
    primaryBorder: '#f7d6e5',

    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    textDisabled: '#94a3b8',

    border: '#e5e7eb',
    borderSubtle: 'rgba(15, 23, 42, 0.06)',

    surface: '#ffffff',
    surfaceHover: '#f8fafc',
    surfaceSunken: '#f1f5f9',
    canvas: '#f8fafc',

    success: '#15803d',
    successSoft: '#f0fdf4',
    warning: '#b45309',
    warningSoft: '#fffbeb',
    danger: '#b91c1c',
    dangerSoft: '#fef2f2',
  },
  space: {
    xs: '4px',
    sm: '8px',
    sm2: '12px',
    md: '16px',
    md2: '20px',
    lg: '24px',
    xl: '32px',
    '2xl': '40px',
    '3xl': '48px',
    '4xl': '64px',
  },
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    dropdown: '10px',
    lg: '16px',
    pill: '999px',
  },
  font: {
    family:
      "'Inter', 'Inter var', -apple-system, BlinkMacSystemFont, 'Segoe UI Variable Text', 'Segoe UI', Roboto, sans-serif",
    familyMono: "'SF Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    sizeSm: '12px',
    sizeMd: '14px',
    sizeBase: '16px',
    sizeLg: '18px',
    sizeValue: '20px',
    sizeXl: '24px',
    size2Xl: '32px',
    lineTight: '1.25',
    lineNormal: '1.5',
    lineRelaxed: '1.65',
  },
  shadow: {
    sm: '0 1px 2px rgba(15, 23, 42, 0.04)',
    md: '0 4px 12px rgba(15, 23, 42, 0.06)',
    lg: '0 8px 28px rgba(15, 23, 42, 0.10)',
    focus: '0 0 0 3px rgba(194, 24, 91, 0.18)',
  },
  layout: {
    sidebarWidth: '248px',
    headerHeight: '60px',
    contentMaxWidth: '1440px',
  },
});
