import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

export const layout = style({
  minHeight: '100vh',
});

/**
 * The rail is its own scroll container so the brand stays at the top and the
 * account block stays pinned to the bottom no matter how long the menu grows.
 */
export const sider = style({
  display: 'none',
  borderRight: `1px solid ${vars.color.border}`,
  position: 'sticky',
  insetBlockStart: 0,
  insetInlineStart: 0,
  height: '100vh',
  zIndex: 20,
  /**
   * The rail/drawer swap is CSS, not a breakpoint hook: antd's `useBreakpoint`
   * reports nothing on the first paint, which would flash the mobile bar.
   */
  '@media': {
    'screen and (min-width: 992px)': { display: 'block' },
  },
});

export const nav = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
});

export const navMenu = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  paddingBottom: vars.space.md,
});

/**
 * Section headers ("MAIN", "SALES", …). They carry the vertical rhythm between
 * groups, so the gap lives on the title rather than on the groups themselves.
 */
globalStyle(`${navMenu} .ant-menu-item-group-title`, {
  paddingInline: vars.space.md,
  paddingBlock: `${vars.space.md} ${vars.space.xs}`,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
});

globalStyle(`${navMenu} .ant-menu-item-group:first-child .ant-menu-item-group-title`, {
  paddingBlockStart: 0,
});

/** The primary action sits above the nav, matching the brand block's padding. */
export const cta = style({
  flexShrink: 0,
  padding: `0 ${vars.space.md} ${vars.space.md}`,
});

export const brand = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm2,
  flexShrink: 0,
  height: vars.layout.headerHeight,
  padding: `0 ${vars.space.md}`,
  marginBottom: vars.space.sm,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
});

export const brandMark = style({
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  width: '30px',
  height: '30px',
  borderRadius: vars.radius.sm,
  backgroundColor: vars.color.primary,
  color: vars.color.surface,
  fontSize: vars.font.sizeBase,
});

export const brandName = style({
  fontSize: vars.font.sizeBase,
  fontWeight: 600,
  letterSpacing: '-0.015em',
  color: vars.color.text,
  lineHeight: vars.font.lineTight,
});

export const brandNameAccent = style({
  color: vars.color.primary,
});

export const account = style({
  flexShrink: 0,
  borderTop: `1px solid ${vars.color.border}`,
  padding: vars.space.sm,
});

export const accountAction = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm2,
  width: '100%',
  padding: vars.space.sm,
  borderRadius: vars.radius.sm,
  cursor: 'pointer',
  transition: 'background-color 120ms ease',
  selectors: {
    '&:hover': { backgroundColor: vars.color.surfaceSunken },
  },
});

export const accountIdentity = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
  lineHeight: vars.font.lineTight,
});

export const accountName = style({
  fontSize: vars.font.sizeMd,
  fontWeight: 500,
  color: vars.color.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const accountRole = style({
  fontSize: '11px',
  color: vars.color.textMuted,
});

/** Mobile only — on `lg` and up the sidebar carries the brand and account. */
export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm2,
  paddingInline: vars.space.md,
  borderBottom: `1px solid ${vars.color.border}`,
  '@media': {
    'screen and (min-width: 992px)': { display: 'none' },
  },
});

export const content = style({
  padding: vars.space.md,
  '@media': {
    'screen and (min-width: 576px)': { padding: vars.space.lg },
    'screen and (min-width: 992px)': { padding: vars.space.xl },
  },
});

export const contentInner = style({
  width: '100%',
  maxWidth: vars.layout.contentMaxWidth,
  marginInline: 'auto',
});
