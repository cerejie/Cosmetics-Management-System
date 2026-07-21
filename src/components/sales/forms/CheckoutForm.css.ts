import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';
import { SINGLE_SCREEN } from '@/styles/breakpoints';

/** Grows to fill a short card — never shrinks, so a tall cart scrolls instead. */
export const form = style({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 0 auto',
});

/** The till is a single screen, so the fields sit tighter than the antd default. */
globalStyle(`${form} .ant-form-item`, {
  marginBottom: vars.space.sm2,
});

globalStyle(`${form} .ant-form-item .ant-form-item-label`, {
  paddingBottom: '2px',
});

export const fields = style({
  flexShrink: 0,
});

/** Opens the discount/note dialog — the till itself stays a fixed height. */
export const extrasTrigger = style({
  marginBottom: vars.space.sm2,
});

/**
 * Totals and actions stay glued to the bottom of the scrolling card body, so
 * the amount due and the pay button are reachable whatever the cart holds.
 * Full-bleed: the card body's inline padding is cancelled and re-applied here.
 */
export const footer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm2,
  marginTop: 'auto',
  marginInline: `calc(-1 * ${vars.space.md})`,
  padding: `${vars.space.sm2} ${vars.space.md} ${vars.space.md}`,
  backgroundColor: vars.color.surface,
  borderTop: `1px solid ${vars.color.border}`,
  '@media': {
    [SINGLE_SCREEN]: {
      position: 'sticky',
      insetBlockEnd: 0,
      zIndex: 1,
    },
  },
});

export const summary = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  padding: `${vars.space.sm} ${vars.space.sm2}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.surfaceHover,
  border: `1px solid ${vars.color.borderSubtle}`,
});

export const row = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  fontSize: vars.font.sizeMd,
  color: vars.color.textSecondary,
});

export const rowValue = style({
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.text,
});

export const totalRow = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  paddingTop: vars.space.sm,
  borderTop: `1px solid ${vars.color.border}`,
});

export const totalLabel = style({
  fontSize: vars.font.sizeSm,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: vars.color.textMuted,
});

export const totalValue = style({
  fontSize: vars.font.sizeXl,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.primary,
});

export const discountRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
});

export const discountPreview = style({
  minWidth: '72px',
  textAlign: 'right',
  fontSize: vars.font.sizeMd,
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.textSecondary,
});

export const actions = style({
  display: 'flex',
  alignItems: 'stretch',
  gap: vars.space.sm,
});

/** Paying is the primary path, so it takes the room the clear button leaves. */
export const submit = style({
  flex: 1,
  minWidth: 0,
});

export const clear = style({
  flexShrink: 0,
});
