import { globalStyle } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

globalStyle('html, body, #root', {
  height: '100%',
  margin: 0,
  padding: 0,
});

globalStyle('body', {
  fontFamily: vars.font.family,
  fontSize: vars.font.sizeMd,
  lineHeight: vars.font.lineNormal,
  color: vars.color.text,
  backgroundColor: vars.color.canvas,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  textRendering: 'optimizeLegibility',
});

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
});

globalStyle('::selection', {
  backgroundColor: vars.color.primarySoft,
  color: vars.color.primaryHover,
});

/** A single visible focus ring for every interactive surface. */
globalStyle(
  'a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible',
  {
    outline: `2px solid ${vars.color.primary}`,
    outlineOffset: '2px',
    borderRadius: vars.radius.sm,
  },
);

/** Numbers must align column-to-column and not jitter while loading. */
globalStyle(
  '.ant-statistic-content, .ant-table-cell, .ant-input-number-input, .ant-descriptions-item-content',
  {
    fontVariantNumeric: 'tabular-nums',
    fontFeatureSettings: "'tnum'",
  },
);

globalStyle('.ant-typography', {
  letterSpacing: '-0.006em',
});

globalStyle('h1.ant-typography, h2.ant-typography, h3.ant-typography', {
  letterSpacing: '-0.018em',
});

/** Table header: quieter, uppercase, and pinned while the body scrolls. */
globalStyle('.ant-table-thead > tr > th.ant-table-cell', {
  fontSize: vars.font.sizeSm,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  paddingBlock: vars.space.sm2,
  borderBottom: `1px solid ${vars.color.border}`,
});

globalStyle('.ant-table-tbody > tr > td.ant-table-cell', {
  transition: 'background-color 120ms ease',
});

globalStyle('.ant-table-wrapper .ant-table', {
  borderRadius: vars.radius.md,
});

globalStyle('.ant-table-wrapper .ant-pagination', {
  marginBlock: `${vars.space.md} 0`,
});

/** Cards sit on a subtle border, not a shadow. Elevation is reserved for overlays. */
globalStyle('.ant-card-bordered, .ant-card-outlined', {
  boxShadow: vars.shadow.sm,
});

globalStyle('.ant-card-head', {
  borderBottom: `1px solid ${vars.color.borderSubtle}`,
});

globalStyle('.ant-modal-content, .ant-dropdown-menu, .ant-select-dropdown, .ant-picker-dropdown', {
  boxShadow: vars.shadow.lg,
});

globalStyle('.ant-list-item', {
  paddingBlock: vars.space.sm2,
});

/** Icon buttons need a 40px hit target even when they render as text buttons. */
globalStyle('.ant-btn-icon-only.ant-btn-sm', {
  minWidth: '32px',
});

globalStyle('.ant-empty-normal, .ant-empty-small', {
  paddingBlock: vars.space.xl,
  marginInline: 0,
});

globalStyle('*::-webkit-scrollbar', {
  width: '10px',
  height: '10px',
});

globalStyle('*::-webkit-scrollbar-thumb', {
  backgroundColor: '#cbd5e1',
  borderRadius: vars.radius.pill,
  border: '3px solid transparent',
  backgroundClip: 'content-box',
});

globalStyle('*::-webkit-scrollbar-track', {
  background: 'transparent',
});

globalStyle('*', {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animationDuration: '0.01ms',
      transitionDuration: '0.01ms',
      scrollBehavior: 'auto',
    },
  },
});
