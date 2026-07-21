import type { ThemeConfig } from 'antd';

/**
 * Keep these values aligned with styles/theme.css.ts — antd owns component
 * styling, vanilla-extract owns layout and bespoke styles.
 *
 * Control height is 40px and control radius 8px across the app; cards use 12px
 * and modals 16px, so surfaces read as a deliberate hierarchy rather than
 * "rounded everything".
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#c2185b',
    colorPrimaryHover: '#ad1457',
    colorPrimaryActive: '#961345',
    colorSuccess: '#15803d',
    colorWarning: '#b45309',
    colorError: '#b91c1c',
    colorInfo: '#c2185b',

    colorText: '#0f172a',
    colorTextSecondary: '#475569',
    colorTextTertiary: '#64748b',
    colorTextQuaternary: '#94a3b8',
    colorTextHeading: '#0f172a',

    colorBgLayout: '#f8fafc',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorFillAlter: '#f8fafc',
    colorFillSecondary: '#f1f5f9',

    colorBorder: '#e5e7eb',
    colorBorderSecondary: '#eef2f6',

    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,

    controlHeight: 40,
    controlHeightSM: 32,
    controlHeightLG: 44,

    fontFamily:
      "'Inter', 'Inter var', -apple-system, BlinkMacSystemFont, 'Segoe UI Variable Text', 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,
    lineHeight: 1.5,

    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    boxShadowSecondary: '0 4px 12px rgba(15, 23, 42, 0.06)',
    boxShadowTertiary: '0 1px 2px rgba(15, 23, 42, 0.04)',

    wireframe: false,
  },
  components: {
    Layout: {
      /** The header only renders below `lg`, where it scrolls with the page. */
      headerBg: '#ffffff',
      siderBg: '#ffffff',
      bodyBg: '#f8fafc',
      headerHeight: 60,
      headerPadding: '0 16px',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#fdf2f7',
      itemSelectedColor: '#c2185b',
      itemHoverBg: '#f1f5f9',
      itemHoverColor: '#0f172a',
      itemColor: '#475569',
      itemHeight: 38,
      itemMarginInline: 8,
      itemMarginBlock: 2,
      itemBorderRadius: 8,
      subMenuItemBg: 'transparent',
      iconSize: 17,
      collapsedIconSize: 18,
      groupTitleColor: '#94a3b8',
      groupTitleFontSize: 11,
      activeBarWidth: 0,
    },
    Card: {
      borderRadiusLG: 12,
      headerFontSize: 15,
      headerHeight: 52,
      headerHeightSM: 44,
      headerBg: 'transparent',
      bodyPadding: 20,
      bodyPaddingSM: 16,
      paddingLG: 20,
      colorBorderSecondary: '#e5e7eb',
    },
    Modal: {
      borderRadiusLG: 16,
      headerBg: 'transparent',
      contentBg: '#ffffff',
      titleFontSize: 18,
      padding: 24,
      paddingContentHorizontalLG: 24,
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#64748b',
      headerSplitColor: 'transparent',
      headerBorderRadius: 0,
      borderColor: '#eef2f6',
      rowHoverBg: '#f8fafc',
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
      footerBg: 'transparent',
      stickyScrollBarBg: '#cbd5e1',
    },
    Button: {
      controlHeight: 40,
      controlHeightSM: 32,
      controlHeightLG: 44,
      borderRadius: 8,
      borderRadiusSM: 6,
      paddingInline: 16,
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
      defaultBorderColor: '#e5e7eb',
      defaultColor: '#0f172a',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
      paddingInline: 12,
      activeShadow: '0 0 0 3px rgba(194, 24, 91, 0.12)',
      hoverBorderColor: '#f7d6e5',
    },
    InputNumber: {
      borderRadius: 8,
      controlHeight: 40,
      activeShadow: '0 0 0 3px rgba(194, 24, 91, 0.12)',
    },
    Select: {
      borderRadius: 8,
      controlHeight: 40,
      optionSelectedBg: '#fdf2f7',
      optionSelectedColor: '#c2185b',
      optionHeight: 34,
    },
    DatePicker: {
      borderRadius: 8,
      controlHeight: 40,
      activeShadow: '0 0 0 3px rgba(194, 24, 91, 0.12)',
    },
    Dropdown: {
      borderRadiusLG: 10,
      controlItemBgHover: '#f1f5f9',
      paddingBlock: 6,
    },
    Form: {
      labelColor: '#334155',
      labelFontSize: 13,
      labelHeight: 22,
      verticalLabelPadding: '0 0 6px',
      itemMarginBottom: 20,
    },
    Tag: {
      borderRadiusSM: 6,
      defaultBg: '#f1f5f9',
      defaultColor: '#475569',
      lineHeightSM: 1.6,
    },
    Statistic: {
      titleFontSize: 13,
      contentFontSize: 24,
    },
    Segmented: {
      borderRadius: 8,
      itemSelectedBg: '#ffffff',
      trackBg: '#f1f5f9',
    },
    Tabs: {
      horizontalItemPadding: '10px 0',
      horizontalItemGutter: 24,
      itemColor: '#64748b',
      titleFontSize: 14,
    },
    Tooltip: {
      borderRadius: 8,
      colorBgSpotlight: '#0f172a',
    },
    Empty: {
      colorTextDescription: '#64748b',
    },
    Pagination: {
      borderRadius: 8,
      itemActiveBg: '#fdf2f7',
    },
    Avatar: {
      colorTextPlaceholder: '#94a3b8',
    },
    Alert: {
      borderRadiusLG: 10,
    },
    Message: {
      borderRadiusLG: 10,
    },
    Drawer: {
      paddingLG: 24,
    },
  },
};
