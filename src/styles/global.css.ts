import { globalStyle } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

globalStyle('html, body, #root', {
  height: '100%',
  margin: 0,
  padding: 0,
});

globalStyle('body', {
  fontFamily: vars.font.family,
  color: vars.color.text,
  backgroundColor: vars.color.canvas,
  WebkitFontSmoothing: 'antialiased',
});

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
});
