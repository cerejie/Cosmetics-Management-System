import { style } from '@vanilla-extract/css';

export const chart = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 6,
  height: 200,
  marginTop: 20,
  overflowX: 'auto',
});

export const column = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  flex: '1 0 22px',
  minWidth: 22,
  height: '100%',
});

export const barTrack = style({
  display: 'flex',
  alignItems: 'flex-end',
  width: '100%',
  flex: 1,
});

export const bar = style({
  width: '100%',
  borderRadius: '4px 4px 0 0',
  background: 'linear-gradient(180deg, #ec4899 0%, #c2185b 100%)',
  transition: 'height 160ms ease',
});

/** A zero day still gets a sliver, so the axis reads as continuous. */
export const barEmpty = style({
  background: '#e2e8f0',
});

export const label = style({
  fontSize: 11,
  color: '#64748b',
  whiteSpace: 'nowrap',
});
