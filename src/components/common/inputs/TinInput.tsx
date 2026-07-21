import { Input } from 'antd';
import { formatTinDigits, toTinDigits } from '@/utils/common/inputMasks';

interface TinInputProps {
  /** Supplied by Form.Item. Always the stored form, `000-000-000-000`. */
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly disabled?: boolean;
  readonly 'aria-label'?: string;
}

/** Groups digits into threes as they are typed and stops at twelve. */
export const TinInput = ({
  value = '',
  onChange,
  disabled,
  'aria-label': ariaLabel,
}: TinInputProps): JSX.Element => (
  <Input
    inputMode="numeric"
    placeholder="000-000-000-000"
    disabled={disabled}
    aria-label={ariaLabel}
    value={formatTinDigits(toTinDigits(value))}
    onChange={(event) => onChange?.(formatTinDigits(toTinDigits(event.target.value)))}
  />
);
