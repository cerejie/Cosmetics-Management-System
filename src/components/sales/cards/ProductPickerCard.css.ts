import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';
import { SINGLE_SCREEN } from '@/styles/breakpoints';

/** On a single screen the card fills its column so only the table body scrolls. */
export const card = style({
  display: 'flex',
  flexDirection: 'column',
  '@media': {
    [SINGLE_SCREEN]: { flex: 1, minWidth: 0, minHeight: 0 },
  },
});

/** Padding is set inline on the card — antd's own body rule outranks a class. */
export const cardBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm2,
  /** Lets the table and the chip rail shrink instead of widening the card. */
  minWidth: 0,
  '@media': {
    [SINGLE_SCREEN]: { flex: 1, minHeight: 0 },
  },
});

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexWrap: 'wrap',
});

export const search = style({
  flex: '1 1 220px',
  minWidth: 0,
});

export const sort = style({
  flex: '0 1 160px',
  minWidth: '120px',
});

export const filterBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  minWidth: 0,
});

/** Categories stay on one line and scroll sideways rather than stacking. */
export const chips = style({
  display: 'flex',
  gap: vars.space.sm,
  flex: 1,
  minWidth: 0,
  overflowX: 'auto',
  paddingBottom: vars.space.xs,
  scrollbarWidth: 'thin',
  selectors: {
    '&::-webkit-scrollbar': { height: '4px' },
  },
});

export const chip = style({
  flexShrink: 0,
});

export const count = style({
  flexShrink: 0,
  paddingInlineStart: vars.space.sm,
  borderInlineStart: `1px solid ${vars.color.border}`,
  fontSize: vars.font.sizeSm,
  fontWeight: 600,
  color: vars.color.textMuted,
  whiteSpace: 'nowrap',
});

export const identity = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const sku = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.textMuted,
});

/**
 * Below `sm` the price and stock columns are dropped, so they move under the
 * product name instead. Swapped in CSS to avoid a first-paint flicker.
 */
export const compactMeta = style([
  sku,
  {
    '@media': {
      'screen and (min-width: 576px)': { display: 'none' },
    },
  },
]);

export const fullMeta = style([
  sku,
  {
    display: 'none',
    '@media': {
      'screen and (min-width: 576px)': { display: 'inline' },
    },
  },
]);

export const filterPanel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm2,
  width: '220px',
});

export const filterRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
});

/**
 * The table carries a fixed `scroll.y` so its body scrolls on every screen. On
 * a single screen the flex chain below overrides that cap so the body takes
 * exactly the height left in the card — header and pager stay put either way.
 */
export const tableArea = style({
  minWidth: 0,
  '@media': {
    [SINGLE_SCREEN]: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
  },
});

const fillColumn = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
} as const;

globalStyle(`${tableArea} .ant-table-wrapper`, {
  '@media': { [SINGLE_SCREEN]: fillColumn },
});

globalStyle(`${tableArea} .ant-spin-nested-loading`, {
  '@media': { [SINGLE_SCREEN]: fillColumn },
});

globalStyle(`${tableArea} .ant-spin-container`, {
  '@media': { [SINGLE_SCREEN]: fillColumn },
});

globalStyle(`${tableArea} .ant-table`, {
  '@media': { [SINGLE_SCREEN]: fillColumn },
});

globalStyle(`${tableArea} .ant-table-container`, {
  '@media': { [SINGLE_SCREEN]: fillColumn },
});

globalStyle(`${tableArea} .ant-table-header`, {
  '@media': { [SINGLE_SCREEN]: { flexShrink: 0 } },
});

globalStyle(`${tableArea} .ant-table-body`, {
  scrollbarWidth: 'thin',
  /** Beats the inline `maxHeight` rc-table sets from `scroll.y`. */
  '@media': { [SINGLE_SCREEN]: { flex: 1, minHeight: 0, maxHeight: 'none !important' } },
});

/** Out-specifies antd's own `.ant-table-wrapper .ant-table-pagination` margin. */
globalStyle(`${tableArea} .ant-table-wrapper .ant-table-pagination`, {
  flexShrink: 0,
  marginBottom: 0,
});
