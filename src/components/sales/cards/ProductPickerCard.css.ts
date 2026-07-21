import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  /** Lets the table and the chip rail shrink instead of widening the card. */
  minWidth: 0,
});

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
});

/** Categories stay on one line and scroll sideways rather than stacking. */
export const chips = style({
  display: 'flex',
  gap: vars.space.sm,
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

export const metaRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  flexWrap: 'wrap',
});

export const metaLabel = style({
  fontSize: vars.font.sizeMd,
  fontWeight: 600,
  color: vars.color.text,
});

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
