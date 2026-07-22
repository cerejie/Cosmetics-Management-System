import { InputNumber, Select, Space } from 'antd';
import type { DiscountTypeValue } from '@/types/common/database.types';

interface DiscountInputProps {
  readonly type: DiscountTypeValue;
  readonly value: number;
  readonly onChange: (next: { readonly type: DiscountTypeValue; readonly value: number }) => void;
  readonly size?: 'middle' | 'large';
  readonly disabled?: boolean;
  readonly label?: string;
}

const TYPE_OPTIONS = [
  { label: '%', value: 'percent' },
  { label: '₱', value: 'amount' },
];

/**
 * A discount is a number plus how to read it. Keeping the two together stops
 * them being changed independently — switching to a percentage while 500 is
 * still in the box would otherwise read as 500% until the next keystroke.
 */
export const DiscountInput = ({
  type,
  value,
  onChange,
  size = 'middle',
  disabled = false,
  label = 'Discount',
}: DiscountInputProps): JSX.Element => (
  <Space.Compact style={{ width: '100%' }}>
    <InputNumber
      size={size}
      min={0}
      max={type === 'percent' ? 100 : undefined}
      precision={2}
      disabled={disabled}
      style={{ width: '100%' }}
      value={value}
      onChange={(next) => onChange({ type, value: next ?? 0 })}
      aria-label={label}
    />
    <Select<DiscountTypeValue>
      size={size}
      disabled={disabled}
      style={{ width: 64 }}
      value={type}
      options={TYPE_OPTIONS}
      // Percentages above 100 are impossible, so a flat amount that would become
      // a nonsense percentage is capped rather than silently rejected on save.
      onChange={(nextType) =>
        onChange({ type: nextType, value: nextType === 'percent' ? Math.min(value, 100) : value })
      }
      aria-label={`${label} type`}
    />
  </Space.Compact>
);
