import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';
import { DESKTOP } from '@/styles/breakpoints';

/**
 * The summary follows the items on the way down a long delivery. It only sticks
 * where there is a second column to stick in; on a narrow screen it is simply
 * the last card on the page.
 */
export const card = style({
  '@media': {
    [DESKTOP]: {
      position: 'sticky',
      top: vars.space.md,
    },
  },
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  minHeight: '32px',
});

export const discountRow = style([
  row,
  {
    gap: vars.space.sm2,
  },
]);

export const discountControl = style({
  width: '160px',
  flexShrink: 0,
});

export const total = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  paddingTop: vars.space.sm2,
  borderTop: `1px solid ${vars.color.border}`,
});
