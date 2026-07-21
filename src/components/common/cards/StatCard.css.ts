import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

export const card = style({
  height: '100%',
});

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm2,
});

export const topRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
});

export const title = style({
  fontSize: vars.font.sizeMd,
  fontWeight: 500,
  color: vars.color.textMuted,
  margin: 0,
});

const iconBase = style({
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  width: '32px',
  height: '32px',
  borderRadius: vars.radius.sm,
  fontSize: '16px',
});

export const icon = styleVariants(
  {
    default: { background: vars.color.surfaceSunken, color: vars.color.textSecondary },
    success: { background: vars.color.successSoft, color: vars.color.success },
    warning: { background: vars.color.warningSoft, color: vars.color.warning },
    danger: { background: vars.color.dangerSoft, color: vars.color.danger },
  },
  (tone) => [iconBase, tone],
);

export const valueRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.sm,
  flexWrap: 'wrap',
});

export const value = style({
  fontSize: vars.font.sizeXl,
  fontWeight: 600,
  letterSpacing: '-0.02em',
  lineHeight: vars.font.lineTight,
  color: vars.color.text,
  fontVariantNumeric: 'tabular-nums',
});

export const suffix = style({
  fontSize: vars.font.sizeMd,
  color: vars.color.textMuted,
  fontVariantNumeric: 'tabular-nums',
});

export const trend = styleVariants({
  up: { color: vars.color.success },
  down: { color: vars.color.danger },
  flat: { color: vars.color.textMuted },
});

export const trendChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  fontSize: vars.font.sizeSm,
  fontWeight: 500,
});

export const hint = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.textMuted,
  margin: 0,
});
