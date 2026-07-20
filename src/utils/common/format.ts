import dayjs from 'dayjs';
import { CURRENCY_CODE, CURRENCY_LOCALE } from '@/config/constants';

const currencyFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: CURRENCY_CODE,
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat(CURRENCY_LOCALE);

export const formatCurrency = (value: number): string => currencyFormatter.format(value);

export const formatNumber = (value: number): string => numberFormatter.format(value);

export const formatDateTime = (value: string): string => dayjs(value).format('DD MMM YYYY, h:mm A');

export const formatDate = (value: string): string => dayjs(value).format('DD MMM YYYY');
