import { Input } from 'antd';
import {
  formatMobileDigits,
  toMobileDigits,
  toStoredMobile,
} from '@/utils/common/inputMasks';

interface MobileNumberInputProps {
  /** Supplied by Form.Item. Always the stored form, `+63 917 123 4567`. */
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly disabled?: boolean;
  readonly 'aria-label'?: string;
}

/**
 * The +63 is fixed chrome rather than something to type, so there is only one
 * way a number can be entered and the stored value is always the same shape.
 * Anything that is not a digit is dropped as it is typed, and the field stops
 * accepting input at ten digits.
 */
export const MobileNumberInput = ({
  value = '',
  onChange,
  disabled,
  'aria-label': ariaLabel,
}: MobileNumberInputProps): JSX.Element => (
  <Input
    addonBefore="+63"
    inputMode="numeric"
    placeholder="917 123 4567"
    disabled={disabled}
    aria-label={ariaLabel}
    value={formatMobileDigits(toMobileDigits(value))}
    onChange={(event) => onChange?.(toStoredMobile(toMobileDigits(event.target.value)))}
  />
);
