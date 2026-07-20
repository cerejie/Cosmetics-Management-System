import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

export const layout = style({
  minHeight: '100vh',
});

export const sider = style({
  borderRight: `1px solid ${vars.color.border}`,
});

export const brand = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  height: '64px',
  padding: `0 ${vars.space.md}`,
  fontSize: vars.font.sizeLg,
  fontWeight: 600,
  color: vars.color.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  padding: `0 ${vars.space.lg}`,
  borderBottom: `1px solid ${vars.color.border}`,
});

export const content = style({
  padding: vars.space.lg,
});
