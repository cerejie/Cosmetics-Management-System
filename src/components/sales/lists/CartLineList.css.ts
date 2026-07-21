import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';
import { SINGLE_SCREEN } from '@/styles/breakpoints';

/**
 * The receipt is capped on desktop and scrolls on its own, so a long cart never
 * pushes the customer and payment fields out of the card.
 */
export const list = style({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  '@media': {
    [SINGLE_SCREEN]: {
      maxHeight: '30vh',
      overflowY: 'auto',
      scrollbarWidth: 'thin',
    },
  },
});

export const line = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm2,
  flexWrap: 'wrap',
  paddingBlock: vars.space.sm,
  selectors: {
    '&:not(:last-child)': { borderBottom: `1px solid ${vars.color.borderSubtle}` },
  },
});

export const identity = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  flex: '1 1 140px',
  minWidth: 0,
});

export const name = style({
  fontSize: vars.font.sizeMd,
  fontWeight: 600,
  color: vars.color.text,
  lineHeight: vars.font.lineTight,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const sku = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.textMuted,
});

export const stepper = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  flexShrink: 0,
  padding: '2px',
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
});

export const quantity = style({
  minWidth: '28px',
  textAlign: 'center',
  fontSize: vars.font.sizeMd,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.text,
});

export const total = style({
  minWidth: '76px',
  textAlign: 'right',
  fontSize: vars.font.sizeMd,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.text,
});
