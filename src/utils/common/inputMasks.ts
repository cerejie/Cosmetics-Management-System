/**
 * Formatting for the two identity fields that appear on every invoice.
 *
 * Both are stored already formatted, because that is exactly how they print.
 * The `to*Digits` functions are the inverse and are deliberately forgiving, so
 * a number pasted as `+639171234567`, `09171234567` or `0917-123-4567` all
 * land on the same ten digits.
 */

/** Philippine mobile numbers are ten digits after the +63 country code. */
export const MOBILE_DIGITS = 10;

/** A TIN is nine digits, or twelve with a branch code. */
export const TIN_DIGITS_MAX = 12;

export const toMobileDigits = (raw: string): string => {
  let digits = raw.replace(/\D/g, '');

  // No Philippine mobile number starts with 6 or 0, so a leading country code
  // or trunk prefix can only be a prefix — never the start of the number.
  if (digits.startsWith('63')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);

  return digits.slice(0, MOBILE_DIGITS);
};

/** `9171234567` → `917 123 4567`. Partial input formats as far as it goes. */
export const formatMobileDigits = (digits: string): string =>
  [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, MOBILE_DIGITS)]
    .filter((group) => group !== '')
    .join(' ');

/** What gets saved: `+63 917 123 4567`, or empty when nothing was typed. */
export const toStoredMobile = (digits: string): string =>
  digits === '' ? '' : `+63 ${formatMobileDigits(digits)}`;

export const isCompleteMobile = (value: string): boolean =>
  toMobileDigits(value).length === MOBILE_DIGITS;

export const toTinDigits = (raw: string): string =>
  raw.replace(/\D/g, '').slice(0, TIN_DIGITS_MAX);

/** `000000000000` → `000-000-000-000`. Partial input formats as far as it goes. */
export const formatTinDigits = (digits: string): string =>
  digits.match(/.{1,3}/g)?.join('-') ?? '';

/** A TIN is only meaningful at nine or twelve digits — never in between. */
export const isCompleteTin = (value: string): boolean => {
  const length = toTinDigits(value).length;
  return length === 9 || length === TIN_DIGITS_MAX;
};
