import type { PaymentMethod } from '../types';

const currency = import.meta.env.VITE_CURRENCY ?? 'USD';
const money = new Intl.NumberFormat(undefined, { style: 'currency', currency });

export const formatMoney = (value: number): string => money.format(value);

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

/** "2026-03" -> "March 2026" */
export const monthLabel = (month: string): string => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

export const currentMonth = (): string => new Date().toISOString().slice(0, 7);
export const today = (): string => new Date().toISOString().slice(0, 10);

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  mobile_money: 'Mobile money',
  bank_transfer: 'Bank transfer',
  other: 'Other',
};

export const PAYMENT_METHODS = Object.keys(PAYMENT_LABELS) as PaymentMethod[];
