import * as styles from './ShortcutHint.css';

interface ShortcutHintProps {
  /** The key as printed on the keyboard, e.g. `F2`. */
  readonly keyLabel: string;
  /** `onPrimary` for filled buttons, `onSurface` for everything else. */
  readonly tone?: 'onPrimary' | 'onSurface';
}

/** Keycap rendered inside a button so its shortcut is visible where it is used. */
export const ShortcutHint = ({ keyLabel, tone = 'onSurface' }: ShortcutHintProps): JSX.Element => (
  <kbd className={styles.hint[tone]}>{keyLabel}</kbd>
);
