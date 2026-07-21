import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

const base = style({
  marginInlineStart: vars.space.sm,
  padding: '1px 6px',
  borderRadius: vars.radius.xs,
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: 1.6,
  fontFamily: vars.font.familyMono,
  /** Cramped screens are touch-first, where a keyboard hint is noise. */
  '@media': {
    '(max-width: 400px)': { display: 'none' },
  },
});

export const hint = styleVariants(
  {
    onPrimary: { backgroundColor: 'rgba(255, 255, 255, 0.22)' },
    onSurface: { backgroundColor: 'rgba(15, 23, 42, 0.06)' },
  },
  (tone) => [base, tone],
);
