import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';
import { SINGLE_SCREEN } from '@/styles/breakpoints';

/**
 * Given enough room the till becomes a single screen: the page holds the
 * viewport height and the picker and the summary scroll internally. `100vh`
 * minus the content padding AppLayout applies at this breakpoint.
 *
 * The shell deliberately does not clip its overflow — if a zoom level or a
 * translation makes the content taller than the height reserved here, the page
 * grows a scrollbar instead of hiding controls.
 */
export const page = style({
  '@media': {
    [SINGLE_SCREEN]: {
      display: 'flex',
      flexDirection: 'column',
      height: `calc(100vh - ${vars.space.xl} - ${vars.space.xl})`,
    },
  },
});

export const columns = style({
  '@media': {
    [SINGLE_SCREEN]: {
      flex: 1,
      minHeight: 0,
    },
  },
});

export const column = style({
  '@media': {
    [SINGLE_SCREEN]: {
      display: 'flex',
      minHeight: 0,
    },
  },
});

export const tip = style({
  flexShrink: 0,
  marginTop: vars.space.md,
});
