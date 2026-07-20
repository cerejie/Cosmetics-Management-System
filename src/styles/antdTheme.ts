import type { ThemeConfig } from 'antd';

/**
 * Keep these values aligned with styles/theme.css.ts — antd owns component
 * styling, vanilla-extract owns layout and bespoke styles.
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#c2185b',
    colorSuccess: '#2e7d32',
    colorWarning: '#ed6c02',
    colorError: '#c62828',
    colorBgLayout: '#faf7f8',
    colorBorderSecondary: '#ebe4e7',
    borderRadius: 10,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
      bodyBg: '#faf7f8',
      headerHeight: 64,
    },
    Menu: {
      itemSelectedBg: '#fce4ec',
      itemSelectedColor: '#c2185b',
    },
    Card: {
      headerFontSize: 16,
    },
    Table: {
      headerBg: '#faf7f8',
      headerColor: '#6b6b6b',
    },
  },
};
