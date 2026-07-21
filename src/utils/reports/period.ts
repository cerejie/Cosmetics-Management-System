import dayjs, { type Dayjs } from 'dayjs';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'annually' | 'custom';

/** Inclusive at both ends, as `YYYY-MM-DD`. */
export interface DateRange {
  readonly from: string;
  readonly to: string;
}

/** How rows are grouped inside the range. */
export type ReportBucket = 'day' | 'week' | 'month';

export const REPORT_PERIOD_OPTIONS: readonly {
  readonly label: string;
  readonly value: ReportPeriod;
}[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annually', value: 'annually' },
  { label: 'Date range', value: 'custom' },
];

const ISO_DATE = 'YYYY-MM-DD';

const toRange = (from: Dayjs, to: Dayjs): DateRange => ({
  from: from.format(ISO_DATE),
  to: to.format(ISO_DATE),
});

/**
 * The named periods all mean "the current one" — today, this week, this month,
 * this year — which is what a shop owner means by "the daily report".
 */
export const resolveRange = (period: ReportPeriod, custom: DateRange | null): DateRange => {
  const now = dayjs();

  switch (period) {
    case 'daily':
      return toRange(now.startOf('day'), now.endOf('day'));
    case 'weekly':
      return toRange(now.startOf('week'), now.endOf('week'));
    case 'monthly':
      return toRange(now.startOf('month'), now.endOf('month'));
    case 'annually':
      return toRange(now.startOf('year'), now.endOf('year'));
    case 'custom':
      return custom ?? toRange(now.startOf('month'), now.endOf('month'));
  }
};

/** Days in the range, inclusive. */
export const rangeLength = (range: DateRange): number =>
  dayjs(range.to).diff(dayjs(range.from), 'day') + 1;

/**
 * Enough buckets to show a shape, few enough to read. A year of daily rows is
 * 365 lines nobody scrolls, so long ranges roll up.
 */
export const bucketFor = (range: DateRange): ReportBucket => {
  const days = rangeLength(range);
  if (days <= 31) return 'day';
  if (days <= 120) return 'week';
  return 'month';
};

/** Sortable key for the bucket a timestamp falls into. */
export const bucketKeyOf = (isoTimestamp: string, bucket: ReportBucket): string =>
  dayjs(isoTimestamp).startOf(bucket).format(ISO_DATE);

const BUCKET_FORMATS: Readonly<Record<ReportBucket, string>> = {
  day: 'DD MMM YYYY',
  week: 'DD MMM YYYY',
  month: 'MMM YYYY',
};

export const bucketLabel = (key: string, bucket: ReportBucket): string => {
  const start = dayjs(key);
  if (bucket !== 'week') return start.format(BUCKET_FORMATS[bucket]);
  return `${start.format('DD MMM')} – ${start.endOf('week').format('DD MMM YYYY')}`;
};

/** Every bucket in the range, so quiet days still appear as zeroes. */
export const bucketKeysIn = (range: DateRange, bucket: ReportBucket): readonly string[] => {
  const keys: string[] = [];
  const last = dayjs(range.to).startOf(bucket);
  let cursor = dayjs(range.from).startOf(bucket);

  while (!cursor.isAfter(last)) {
    keys.push(cursor.format(ISO_DATE));
    cursor = cursor.add(1, bucket);
  }

  return keys;
};

export const describeRange = (range: DateRange): string =>
  range.from === range.to
    ? dayjs(range.from).format('DD MMM YYYY')
    : `${dayjs(range.from).format('DD MMM YYYY')} – ${dayjs(range.to).format('DD MMM YYYY')}`;

/** A timestamp is in range when its calendar day is, so time of day is ignored. */
export const isWithinRange = (isoTimestamp: string, range: DateRange): boolean => {
  const day = dayjs(isoTimestamp).format(ISO_DATE);
  return day >= range.from && day <= range.to;
};
