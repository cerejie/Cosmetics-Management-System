import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

export const card = style({
  background: vars.color.surfaceSunken,
  borderColor: vars.color.borderSubtle,
});

export const avatar = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  flexShrink: 0,
  borderRadius: vars.radius.sm,
  background: vars.color.surface,
  border: `1px solid ${vars.color.border}`,
  color: vars.color.textSecondary,
});

/**
 * Two columns where there is room, one where there is not — the card sits in a
 * form column that narrows a long way on a tablet.
 */
export const facts = style({
  display: 'grid',
  gap: vars.space.sm2,
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
});
