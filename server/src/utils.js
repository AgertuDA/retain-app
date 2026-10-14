import mongoose from 'mongoose';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const isId = (value) => mongoose.isValidObjectId(value);

export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Returns [start, end) UTC dates for a "YYYY-MM" string. */
export function monthRange(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) throw new HttpError(400, 'month must use the format YYYY-MM');
  const [y, m] = month.split('-').map(Number);
  return [new Date(Date.UTC(y, m - 1, 1)), new Date(Date.UTC(y, m, 1))];
}

export const currentMonth = () => new Date().toISOString().slice(0, 7);

export const budgetStatus = (spent, budget) => {
  if (budget == null || budget <= 0) return 'none';
  if (spent > budget) return 'over';
  if (spent >= budget * 0.8) return 'approaching';
  return 'within';
};
