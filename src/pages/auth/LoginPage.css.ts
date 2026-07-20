import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

export const page = style({
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: vars.space.md,
  background: `linear-gradient(160deg, ${vars.color.primarySoft} 0%, ${vars.color.canvas} 60%)`,
});

export const card = style({
  width: '100%',
  maxWidth: '400px',
});
