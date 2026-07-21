/**
 * Media queries shared by the vanilla-extract stylesheets.
 *
 * `SINGLE_SCREEN` gates layouts that pin themselves to the viewport height.
 * It asks for room in *both* axes on purpose: browser zoom shrinks the viewport
 * in CSS pixels, so a page that only checked the width would keep its fixed
 * height while the content inside it grew, and push controls out of reach.
 * Below either threshold the layout falls back to normal document flow.
 */
export const SINGLE_SCREEN = 'screen and (min-width: 992px) and (min-height: 680px)';

export const DESKTOP = 'screen and (min-width: 992px)';
