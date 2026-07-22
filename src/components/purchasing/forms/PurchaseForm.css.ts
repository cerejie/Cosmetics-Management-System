import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';
import { DESKTOP } from '@/styles/breakpoints';

export const section = style({
  marginBottom: vars.space.md,
});

/** The step number beside each section heading. */
export const step = style({
  marginTop: vars.space.sm,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  flexShrink: 0,
  borderRadius: vars.radius.pill,
  background: vars.color.primary,
  color: vars.color.surface,
  fontSize: vars.font.sizeSm,
  fontWeight: 600,
});

/**
 * Room for the sticky action bar to sit over without ever covering the last
 * field. Only needed where the bar is actually stuck.
 */
export const scroller = style({
  '@media': {
    [DESKTOP]: {
      paddingBottom: '80px',
    },
  },
});

/**
 * The running total and the save button, kept in reach on a long delivery.
 * Static on small screens: pinning it there costs more of the keyboard-shrunken
 * viewport than it gives back.
 */
export const actionBar = style({
  marginTop: vars.space.md,
  padding: vars.space.sm2,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.surface,
  '@media': {
    [DESKTOP]: {
      position: 'sticky',
      bottom: vars.space.md,
      boxShadow: vars.shadow.lg,
    },
  },
});
