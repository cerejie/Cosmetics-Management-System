import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

export const chart = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: vars.space.xs,
  height: '180px',
  paddingTop: vars.space.md,
});

export const column = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: vars.space.xs,
  minWidth: 0,
});

export const bar = style({
  width: '100%',
  minHeight: '2px',
  borderRadius: `${vars.radius.sm} ${vars.radius.sm} 0 0`,
  backgroundColor: vars.color.primary,
  transition: 'background-color 120ms ease',
  selectors: {
    '&:hover': {
      backgroundColor: vars.color.primaryHover,
    },
  },
});

export const label = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.textMuted,
  whiteSpace: 'nowrap',
});
