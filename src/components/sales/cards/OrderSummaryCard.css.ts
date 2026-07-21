import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';
import { SINGLE_SCREEN } from '@/styles/breakpoints';

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  '@media': {
    [SINGLE_SCREEN]: { flex: 1, minWidth: 0, minHeight: 0 },
  },
});

/**
 * The body is the scroll container: the cart and the fields scroll under the
 * totals, which stay pinned. Its padding is set inline on the card — antd's own
 * body rule outranks a class — and its bottom edge belongs to that pinned
 * footer, so nothing peeks out beneath it.
 */
export const cardBody = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  '@media': {
    [SINGLE_SCREEN]: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      scrollbarWidth: 'thin',
    },
  },
});

export const divider = style({
  flexShrink: 0,
  marginBlock: vars.space.sm2,
});
