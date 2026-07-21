import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';
import { DESKTOP } from '@/styles/breakpoints';

/**
 * The sign-in shell: a brand panel beside the form.
 *
 * Everything that moves here is decorative — gradients, drifting orbs and the
 * entrance stagger. The global `prefers-reduced-motion` rule in
 * styles/global.css.ts collapses all of it, so nothing below needs its own
 * media query for that.
 */

const drift = keyframes({
  '0%, 100%': { backgroundPosition: '0% 50%' },
  '50%': { backgroundPosition: '100% 50%' },
});

const floatOrb = keyframes({
  '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
  '33%': { transform: 'translate3d(-24px, 34px, 0) scale(1.12)' },
  '66%': { transform: 'translate3d(18px, -26px, 0) scale(0.92)' },
});

const sweep = keyframes({
  '0%': { transform: 'translate3d(-12%, 0, 0) rotate(-4deg)' },
  '100%': { transform: 'translate3d(12%, 0, 0) rotate(4deg)' },
});

const riseIn = keyframes({
  from: { opacity: 0, transform: 'translate3d(0, 16px, 0)' },
  to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
});

const cardIn = keyframes({
  from: { opacity: 0, transform: 'translate3d(0, 24px, 0) scale(0.98)' },
  to: { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
});

const sheen = keyframes({
  '0%': { backgroundPosition: '0% 50%' },
  '100%': { backgroundPosition: '200% 50%' },
});

export const page = style({
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: '1fr',
  backgroundColor: vars.color.surface,
  '@media': {
    [DESKTOP]: { gridTemplateColumns: '1fr 1fr' },
  },
});

/* ---------------------------------------------------------------- brand ---- */

export const brand = style({
  display: 'none',
  position: 'relative',
  overflow: 'hidden',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: vars.space.xl,
  padding: `${vars.space['3xl']} ${vars.space['3xl']}`,
  background: `linear-gradient(135deg, #fdeef5 0%, #fbe2ee 32%, #f8d7e7 58%, #fce7f1 82%, #fdf1f7 100%)`,
  backgroundSize: '220% 220%',
  animation: `${drift} 24s ease-in-out infinite`,
  '@media': {
    [DESKTOP]: { display: 'flex' },
  },
});

/** Concentric arcs echoing the wave in the bottom-right of the panel. */
export const brandWaves = style({
  position: 'absolute',
  inset: '-20% -30%',
  pointerEvents: 'none',
  background: `repeating-radial-gradient(circle at 100% 55%, transparent 0 46px, rgba(194, 24, 91, 0.05) 46px 48px)`,
  animation: `${sweep} 18s ease-in-out infinite alternate`,
});

/** Soft pink bubble. Sized and placed by the caller through `orbStyle`. */
export const orb = style({
  position: 'absolute',
  borderRadius: vars.radius.pill,
  background: 'radial-gradient(circle at 32% 28%, #ffc2da 0%, #f871a6 60%, #e8548f 100%)',
  filter: 'blur(0.4px)',
  opacity: 0.75,
  pointerEvents: 'none',
  animation: `${floatOrb} 16s ease-in-out infinite`,
});

export const brandBody = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space['3xl'],
});

export const brandIntro = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  maxWidth: '440px',
  animation: `${riseIn} 700ms 120ms ease-out both`,
});

export const logo = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  animation: `${riseIn} 700ms ease-out both`,
});

export const logoMark = style({
  display: 'grid',
  placeItems: 'center',
  width: '56px',
  height: '56px',
  flexShrink: 0,
  fontSize: '30px',
  color: vars.color.primary,
  borderRadius: vars.radius.lg,
  border: `2px solid ${vars.color.primary}`,
});

/**
 * The brand name is the page's `h1`, but antd sizes an h1 at 32px — larger than
 * the wordmark should read next to the form. Pin it back to the h2 step.
 */
export const logoName = style({
  margin: 0,
  fontSize: vars.font.sizeXl,
});

export const accent = style({
  color: vars.color.primary,
});

/** Larger than antd's h3 so the claim carries the panel. */
export const headline = style({
  margin: 0,
  fontSize: '30px',
  lineHeight: vars.font.lineTight,
});

export const rule = style({
  width: '64px',
  height: '3px',
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.primary,
});

export const features = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md2,
});

export const feature = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  animation: `${riseIn} 600ms ease-out both`,
  transition: 'transform 200ms ease',
  selectors: {
    '&:nth-child(1)': { animationDelay: '240ms' },
    '&:nth-child(2)': { animationDelay: '320ms' },
    '&:nth-child(3)': { animationDelay: '400ms' },
    '&:nth-child(4)': { animationDelay: '480ms' },
    '&:nth-child(5)': { animationDelay: '560ms' },
    '&:hover': { transform: 'translateX(4px)' },
  },
});

export const featureIcon = style({
  display: 'grid',
  placeItems: 'center',
  width: '44px',
  height: '44px',
  flexShrink: 0,
  fontSize: vars.font.sizeLg,
  color: vars.color.primary,
  backgroundColor: 'rgba(255, 255, 255, 0.72)',
  border: `1px solid ${vars.color.primaryBorder}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.sm,
});

export const brandFooter = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md2,
  animation: `${riseIn} 700ms 640ms ease-out both`,
});

export const badges = style({
  display: 'flex',
  gap: vars.space.lg,
  paddingTop: vars.space.lg,
  borderTop: `1px solid ${vars.color.primaryBorder}`,
});

export const badge = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm2,
  flex: 1,
  minWidth: 0,
  selectors: {
    '& + &': {
      paddingLeft: vars.space.lg,
      borderLeft: `1px solid ${vars.color.primaryBorder}`,
    },
  },
});

export const badgeIcon = style({
  fontSize: vars.font.sizeXl,
  color: vars.color.primary,
  lineHeight: 1,
});

/* ----------------------------------------------------------------- form ---- */

export const formPane = style({
  display: 'grid',
  placeItems: 'center',
  padding: vars.space.lg,
  background: `linear-gradient(200deg, ${vars.color.primarySoft} 0%, ${vars.color.surface} 45%, ${vars.color.primarySoft} 100%)`,
  backgroundSize: '180% 180%',
  animation: `${drift} 30s ease-in-out infinite`,
});

export const card = style({
  width: '100%',
  maxWidth: '460px',
  padding: vars.space.xl,
  backgroundColor: vars.color.surface,
  borderRadius: vars.radius.lg,
  boxShadow: '0 24px 60px rgba(194, 24, 91, 0.10), 0 2px 8px rgba(15, 23, 42, 0.04)',
  animation: `${cardIn} 600ms 80ms ease-out both`,
  '@media': {
    [DESKTOP]: { padding: vars.space['3xl'] },
  },
});

export const cardHeader = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.xs,
  marginBottom: vars.space.xl,
  textAlign: 'center',
});

/** Larger than antd's h2 so the greeting outweighs the field labels below it. */
export const cardTitle = style({
  margin: 0,
  fontSize: '28px',
  lineHeight: vars.font.lineTight,
});

export const cardBadge = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  width: '72px',
  height: '72px',
  marginBottom: vars.space.sm,
  fontSize: vars.font.sizeXl,
  color: vars.color.primary,
  backgroundColor: vars.color.primarySoft,
  borderRadius: vars.radius.pill,
});

/**
 * Only shown when the brand panel is hidden, so the page still says its name —
 * and still carries an `h1`, since the branded one is display:none by then.
 */
export const compactBrand = style({
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm2,
  marginBottom: vars.space.lg,
  fontSize: vars.font.sizeLg,
  fontWeight: 700,
  color: vars.color.primary,
  '@media': {
    [DESKTOP]: { display: 'none' },
  },
});

/**
 * Form rhythm, scoped to the card.
 *
 * The app-wide theme pairs a 13px label with a 14px control, which reads fine in
 * a dense table view. These fields are `size="large"` (16px), so the same label
 * looks undersized against them — hence the local bump. Everything here is
 * spacing and type scale; colours and radii still come from the antd theme.
 */
/**
 * Three distinct steps, so the eye can group the form without reading it:
 * 4px binds a label to its own field, 20px separates one field from the next,
 * and the submit button adds 8px on top of that to stand apart from both.
 * Keeping these different is the whole point — at one uniform gap the labels
 * float between fields and the button reads as a fifth input.
 */
globalStyle(`${card} .ant-form-item`, {
  marginBottom: vars.space.sm,
});

globalStyle(`${card} .ant-form-item-label`, {
  paddingBottom: vars.space.xs,
});

/** Both auth forms render the submit button as a direct child of the form. */
globalStyle(`${card} .ant-form > .ant-btn`, {
  marginTop: vars.space.md,
});

globalStyle(`${card} .ant-form-item-label > label`, {
  height: 'auto',
  fontSize: vars.font.sizeMd,
  fontWeight: 500,
  color: vars.color.text,
});

/** Helper text sat flush against the next label; give it room on both sides. */
globalStyle(`${card} .ant-form-item-extra`, {
  marginTop: vars.space.sm,
  fontSize: vars.font.sizeSm,
  lineHeight: vars.font.lineNormal,
  color: vars.color.textMuted,
});

globalStyle(`${card} .ant-form-item-explain`, {
  marginTop: vars.space.xs,
  fontSize: vars.font.sizeSm,
});

/** Taller than the app's 44px control so the fields carry the larger type. */
globalStyle(`${card} .ant-input-affix-wrapper, ${card} .ant-input`, {
  minHeight: '48px',
  paddingInline: vars.space.sm2,
  fontSize: vars.font.sizeBase,
});

/** The affix wrapper owns the padding; the inner input must not double it. */
globalStyle(`${card} .ant-input-affix-wrapper > .ant-input`, {
  minHeight: 'auto',
  paddingInline: 0,
});

globalStyle(`${card} .ant-input-prefix`, {
  marginInlineEnd: vars.space.sm2,
  color: vars.color.textDisabled,
});

globalStyle(`${card} .ant-btn.ant-btn-primary`, {
  height: '48px',
  fontSize: vars.font.sizeBase,
  fontWeight: 600,
});

/**
 * A slow sheen across the submit button — the card's only moving control.
 * antd injects its own button styles at runtime, so the selectors below name
 * `.ant-btn` as well to outweigh its `:hover` rule, which would otherwise flatten
 * the gradient back to a solid fill on a specificity tie.
 */
globalStyle(
  `${card} .ant-btn.ant-btn-primary:not(:disabled), ${card} .ant-btn.ant-btn-primary:not(:disabled):hover`,
  {
    background: `linear-gradient(100deg, ${vars.color.primary} 0%, #e0356f 25%, ${vars.color.primary} 50%, #e0356f 75%, ${vars.color.primary} 100%)`,
    backgroundSize: '200% 100%',
    border: 'none',
    animation: `${sheen} 8s linear infinite`,
  },
);

globalStyle(`${card} .ant-btn.ant-btn-primary:not(:disabled):hover`, {
  transform: 'translateY(-1px)',
  boxShadow: '0 8px 20px rgba(194, 24, 91, 0.28)',
});
