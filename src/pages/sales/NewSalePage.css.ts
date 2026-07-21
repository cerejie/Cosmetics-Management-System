import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

/** The summary only pins once the two columns sit side by side. */
export const summaryColumn = style({
  '@media': {
    'screen and (min-width: 992px)': {
      position: 'sticky',
      insetBlockStart: vars.space.lg,
    },
  },
});

export const tip = style({
  marginTop: vars.space.md,
});
