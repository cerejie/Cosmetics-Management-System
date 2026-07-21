import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

export const chart = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-end',
  gap: vars.space.sm,
  height: '220px',
  paddingTop: vars.space.md,
  /** Four evenly spaced gridlines so bar heights can be read, not guessed. */
  backgroundImage: `repeating-linear-gradient(to top, ${vars.color.borderSubtle} 0 1px, transparent 1px 25%)`,
  backgroundSize: '100% calc(100% - 22px)',
  backgroundPosition: 'bottom',
  backgroundRepeat: 'no-repeat',
});

export const column = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: vars.space.sm,
  minWidth: 0,
  height: '100%',
});

export const barTrack = style({
  width: '100%',
  flex: 1,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  cursor: 'default',
});

export const bar = style({
  width: '100%',
  maxWidth: '32px',
  minHeight: '3px',
  borderRadius: `${vars.radius.xs} ${vars.radius.xs} 0 0`,
  backgroundColor: vars.color.primary,
  opacity: 0.85,
  transition: 'opacity 120ms ease, background-color 120ms ease',
  selectors: {
    '&:hover': {
      opacity: 1,
      backgroundColor: vars.color.primaryHover,
    },
  },
});

export const barEmpty = style({
  backgroundColor: vars.color.surfaceSunken,
  opacity: 1,
  selectors: {
    '&:hover': { backgroundColor: vars.color.surfaceSunken, opacity: 1 },
  },
});

export const label = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.textMuted,
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
});
