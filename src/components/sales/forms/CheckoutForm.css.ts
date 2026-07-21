import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

export const summary = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  padding: vars.space.md,
  marginBottom: vars.space.md,
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
  flexDirection: 'column',
  gap: vars.space.sm,
});
